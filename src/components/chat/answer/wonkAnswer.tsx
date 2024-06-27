'use client';
import Link from 'next/link';
import remarkGfm from 'remark-gfm';

import { useGtagEvent } from '@/lib/hooks/useGtagEvent';
import { MemoizedReactMarkdown } from '@/lib/markdown';
import { GTagEvents } from '@/models/gtag';

interface AnswerMarkdownProps {
  text: string;
}

const WonkAnswer: React.FC<AnswerMarkdownProps> = ({ text }) => {
  const gtagEvent = useGtagEvent();
  const sanitizedText = sanitizeMarkdown(text);

  return (
    <MemoizedReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ node, ...props }) => {
          // external links should open in a new tab
          if (props.href?.startsWith('http')) {
            return (
              <a
                onClick={() => {
                  gtagEvent({
                    event: GTagEvents.CITATION_EXTERNAL,
                  });
                }}
                {...props}
                target='_blank'
                rel='noopener noreferrer'
              />
            );
          }
          // internal links might be footnotes and we want to handle them differently
          else if (props.href?.startsWith('#')) {
            const footnoteRef = Object.keys(props).find(
              (key) => key === 'data-footnote-ref'
            );

            if (footnoteRef) {
              // for footnote references, we want to show them in a superscript
              return <sup>{props.children}</sup>;
            }

            const footnoteBackRef = Object.keys(props).find(
              (key) => key === 'data-footnote-backref'
            );

            if (footnoteBackRef) {
              // don't render the backref
              return null;
            }

            // other internal links should be handled by next/link
            return (
              <Link
                onClick={() => {
                  gtagEvent({
                    event: GTagEvents.CITATION_INTERNAL,
                  });
                }}
                {...props}
                href={props.href || '#'}
              />
            );
          } else {
            // regular links (like mailto:)
            return <a {...props} />;
          }
        },
      }}
    >
      {sanitizedText}
    </MemoizedReactMarkdown>
  );
};

export default WonkAnswer;
