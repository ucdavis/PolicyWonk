import type { StreamTextTransform, TextStreamPart } from 'ai';
import { nanoid } from 'nanoid';

export type CitationPolicy = {
  docNumber: number;
  metadata: {
    title: string;
    url: string;
  };
};

export const createCitationsTransform = ({
  policies,
  onAssistantTextComplete,
}: {
  policies: CitationPolicy[];
  onAssistantTextComplete: (assistantText: string) => Promise<void>;
}): StreamTextTransform<any> => {
  const usedCitationDocNums = new Set<number>();
  let buffer = '';
  let assistantText = '';
  let didPersist = false;

  return () =>
    new TransformStream<TextStreamPart<any>, TextStreamPart<any>>({
      async transform(chunk, controller) {
        if (chunk.type === 'text-delta') {
          const combined = buffer + chunk.text;

          let cutoffIndex = combined.length;
          buffer = '';

          let searchFrom = combined.length;
          while (true) {
            if (searchFrom <= 0) {
              break;
            }

            const idx = combined.lastIndexOf('<', searchFrom - 1);
            if (idx === -1) {
              break;
            }

            const tail = combined.slice(idx);
            if (
              /^<$/.test(tail) ||
              /^<c$/.test(tail) ||
              /^<c:$/.test(tail) ||
              /^<c:\d+$/.test(tail)
            ) {
              cutoffIndex = idx;
              buffer = tail;
              break;
            }

            if (idx === 0) {
              break;
            }

            searchFrom = idx;
          }

          const toEmit = combined.slice(0, cutoffIndex);
          const transformed = toEmit.replace(/<c:(\d+)>/g, (_match, docNum) => {
            const parsed = Number(docNum);
            if (Number.isInteger(parsed)) {
              usedCitationDocNums.add(parsed);
            }
            return `[^${docNum}]`;
          });

          assistantText += transformed;

          if (transformed) {
            controller.enqueue({ ...chunk, text: transformed });
          }

          return;
        }

        if (chunk.type === 'finish-step') {
          buffer = '';

          const usedPolicies = policies.filter((p) =>
            usedCitationDocNums.has(p.docNumber)
          );

          if (usedPolicies.length > 0) {
            const citationFootnoteMarkdown = usedPolicies
              .map(
                (p) =>
                  `[^${p.docNumber}]: [${p.metadata.title}](${p.metadata.url})`
              )
              .join('\n');

            const citations = `\n\n## Citations\n${citationFootnoteMarkdown}\n`;
            assistantText += citations;

            const citationsTextId = nanoid();
            controller.enqueue({ type: 'text-start', id: citationsTextId });
            controller.enqueue({
              type: 'text-delta',
              id: citationsTextId,
              text: citations,
            });
            controller.enqueue({ type: 'text-end', id: citationsTextId });
          }

          if (!didPersist) {
            didPersist = true;
            await onAssistantTextComplete(assistantText);
          }

          controller.enqueue(chunk);
          return;
        }

        controller.enqueue(chunk);
      },
    });
};
