'use client';
import Link from 'next/link';
import remarkGfm from 'remark-gfm';

import { useGtagEvent } from '../../../lib/hooks/useGtagEvent';
import { MemoizedReactMarkdown } from '../../../lib/markdown';
import { sanitizeMarkdown } from '../../../lib/util';
import { GTagEvents } from '../../../models/gtag';

interface WonkAnswerProps {
  text: string;
  onCitationClick?: (citationHref: string) => void;
}

const WonkAnswer: React.FC<WonkAnswerProps> = ({ text, onCitationClick }) => {
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
                className='citation-link text-blue-600 hover:underline'
                onClick={(e) => {
                  e.preventDefault();
                  if (onCitationClick && props.href) {
                    onCitationClick(props.href || '');
                  }
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
            return (
              <a
                className='citation-link text-blue-600 hover:underline cursor-pointer'
                onClick={(e) => {
                  e.preventDefault(); // prevent actual navigation
                  if (onCitationClick && props.href) {
                    onCitationClick(props.href);
                  }
                }}
              >
                {props.children}
              </a>
            );
          }
        },
      }}
    >
      {sanitizedText}
    </MemoizedReactMarkdown>
  );
};

export default WonkAnswer;
