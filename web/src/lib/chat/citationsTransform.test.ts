import type { TextStreamPart } from 'ai';
import { describe, expect, it, vi } from 'vitest';

import {
  createCitationsTransform,
  type CitationPolicy,
} from './citationsTransform';

const runTransform = async ({
  chunks,
  policies,
}: {
  chunks: TextStreamPart<any>[];
  policies: CitationPolicy[];
}) => {
  const onAssistantTextComplete = vi.fn(async () => {});

  const transform = createCitationsTransform({
    policies,
    onAssistantTextComplete,
  })({ tools: {}, stopStream: () => {} });

  const input = new ReadableStream<TextStreamPart<any>>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(chunk);
      }
      controller.close();
    },
  });

  const reader = input.pipeThrough(transform).getReader();
  const output: TextStreamPart<any>[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    output.push(value);
  }

  const outputText = output
    .filter((chunk) => chunk.type === 'text-delta')
    .map((chunk) => chunk.text)
    .join('');

  return { output, outputText, onAssistantTextComplete };
};

describe('createCitationsTransform', () => {
  const basePolicies: CitationPolicy[] = [
    {
      docNumber: 0,
      metadata: { title: 'Doc 0', url: 'https://example.com/0' },
    },
    {
      docNumber: 2,
      metadata: { title: 'Doc 2', url: 'https://example.com/2' },
    },
    {
      docNumber: 7,
      metadata: { title: 'Doc 7', url: 'https://example.com/7' },
    },
  ];

  it('replaces <c:id> markers and appends citation footnotes', async () => {
    const { outputText, onAssistantTextComplete } = await runTransform({
      policies: basePolicies,
      chunks: [
        { type: 'text-start', id: 't1' },
        {
          type: 'text-delta',
          id: 't1',
          text: 'Hello <c:0> world <c:2>.',
        },
        { type: 'text-end', id: 't1' },
        {
          type: 'finish-step',
          response: {} as any,
          usage: {} as any,
          finishReason: 'stop' as any,
          rawFinishReason: undefined,
          providerMetadata: undefined,
        },
        {
          type: 'finish',
          finishReason: 'stop' as any,
          rawFinishReason: undefined,
          totalUsage: {} as any,
        },
      ],
    });

    expect(outputText).toContain('Hello [^0] world [^2].');
    expect(outputText).toContain('## Citations');
    expect(outputText).toContain('[^0]: [Doc 0](https://example.com/0)');
    expect(outputText).toContain('[^2]: [Doc 2](https://example.com/2)');
    expect(outputText).not.toContain('[^7]: [Doc 7](https://example.com/7)');

    expect(onAssistantTextComplete).toHaveBeenCalledTimes(1);
    expect(onAssistantTextComplete.mock.calls[0]?.[0]).toContain(
      '[^0]: [Doc 0](https://example.com/0)'
    );
  });

  it('handles citation markers split across chunks', async () => {
    const { outputText } = await runTransform({
      policies: basePolicies,
      chunks: [
        { type: 'text-start', id: 't1' },
        { type: 'text-delta', id: 't1', text: 'Start <c:' },
        { type: 'text-delta', id: 't1', text: '0> end.' },
        { type: 'text-end', id: 't1' },
        {
          type: 'finish-step',
          response: {} as any,
          usage: {} as any,
          finishReason: 'stop' as any,
          rawFinishReason: undefined,
          providerMetadata: undefined,
        },
        {
          type: 'finish',
          finishReason: 'stop' as any,
          rawFinishReason: undefined,
          totalUsage: {} as any,
        },
      ],
    });

    expect(outputText).toContain('Start [^0] end.');
    expect(outputText).not.toContain('<c:');
  });

  it('does not add a citations section when no citations are used', async () => {
    const { outputText } = await runTransform({
      policies: basePolicies,
      chunks: [
        { type: 'text-start', id: 't1' },
        { type: 'text-delta', id: 't1', text: 'No citations here.' },
        { type: 'text-end', id: 't1' },
        {
          type: 'finish-step',
          response: {} as any,
          usage: {} as any,
          finishReason: 'stop' as any,
          rawFinishReason: undefined,
          providerMetadata: undefined,
        },
        {
          type: 'finish',
          finishReason: 'stop' as any,
          rawFinishReason: undefined,
          totalUsage: {} as any,
        },
      ],
    });

    expect(outputText).toBe('No citations here.');
    expect(outputText).not.toContain('## Citations');
  });
});
