'use client';
import { useId } from 'react';

import Link from 'next/link';
import remarkGfm from 'remark-gfm';

import { useGtagEvent } from '../../../lib/hooks/useGtagEvent';
import { MemoizedReactMarkdown } from '../../../lib/markdown';
import { sanitizeMarkdown } from '../../../lib/util';
import { GTagEvents } from '../../../models/gtag';

interface WonkAnswerProps {
  text: string;
}

const hasMarkdownAttribute = (props: object, attribute: string) =>
  Object.prototype.hasOwnProperty.call(props, attribute);

const WonkAnswer: React.FC<WonkAnswerProps> = ({ text }) => {
  const answerId = useId();
  const gtagEvent = useGtagEvent();
  const sanitizedText = sanitizeMarkdown(text);

  return (
    <div className='min-w-0'>
      <MemoizedReactMarkdown
        remarkPlugins={[remarkGfm]}
        remarkRehypeOptions={{ clobberPrefix: `answer-${answerId}-` }}
        components={{
          img: () => null,
          h1: ({ node, ...props }) => (
            <h1
              {...props}
              className='mb-4 text-2xl font-semibold leading-tight'
            />
          ),
          h2: ({ node, ...props }) => (
            <h2
              {...props}
              className={
                props.id === 'footnote-label'
                  ? 'mb-3 text-base font-semibold'
                  : 'mb-1 mt-6 text-xl font-semibold leading-snug'
              }
            />
          ),
          h3: ({ node, ...props }) => (
            <h3
              {...props}
              className='mb-2 mt-5 text-lg font-semibold leading-snug'
            />
          ),
          p: ({ node, ...props }) => (
            <p {...props} className='mb-2 leading-7 last:mb-0' />
          ),
          ul: ({ node, ...props }) => (
            <ul {...props} className='mb-2 list-disc space-y-2 pl-6' />
          ),
          ol: ({ node, ...props }) => (
            <ol {...props} className='mb-2 list-decimal space-y-2 pl-6' />
          ),
          li: ({ node, ...props }) => <li {...props} className='pl-1' />,
          blockquote: ({ node, ...props }) => (
            <blockquote
              {...props}
              className='mb-4 border-l-4 border-primary/40 pl-4 italic text-base-content/80'
            />
          ),
          hr: ({ node, ...props }) => (
            <hr {...props} className='my-6 border-main-border' />
          ),
          code: ({ node, className, ...props }) => (
            <code
              {...props}
              className={
                className
                  ? `${className} font-mono text-sm`
                  : 'rounded bg-base-200 px-1.5 py-0.5 font-mono text-sm'
              }
            />
          ),
          pre: ({ node, ...props }) => (
            <pre
              {...props}
              className='mb-4 overflow-x-auto rounded-box bg-neutral p-4 text-sm text-neutral-content'
            />
          ),
          table: ({ node, ...props }) => (
            <div className='mb-4 overflow-x-auto'>
              <table {...props} className='table table-sm w-full' />
            </div>
          ),
          th: ({ node, ...props }) => (
            <th {...props} className='whitespace-nowrap font-semibold' />
          ),
          td: ({ node, ...props }) => (
            <td {...props} className='align-middle' />
          ),
          section: ({ node, ...props }) => (
            <section
              {...props}
              className={
                hasMarkdownAttribute(props, 'data-footnotes')
                  ? 'mt-4 border-t border-main-border pt-4 text-sm leading-6'
                  : props.className
              }
            />
          ),
          a: ({ node, ...props }) => {
            const isFootnoteReference = hasMarkdownAttribute(
              props,
              'data-footnote-ref'
            );
            const isFootnoteBackReference = hasMarkdownAttribute(
              props,
              'data-footnote-backref'
            );
            const linkClassName =
              'font-medium text-primary underline decoration-primary/40 underline-offset-2 transition-colors hover:text-primary/80 hover:decoration-primary';

            if (isFootnoteBackReference) {
              return <a {...props} className={linkClassName} />;
            }

            if (isFootnoteReference) {
              return (
                <a
                  {...props}
                  className='ml-0.5 inline-flex min-w-5 items-center justify-center rounded bg-base-200 px-1.5 py-0.5 text-xs font-semibold no-underline transition-colors hover:bg-primary hover:text-primary-content'
                />
              );
            }

            if (props.href?.startsWith('http')) {
              return (
                <a
                  {...props}
                  className={linkClassName}
                  target='_blank'
                  onClick={() => {
                    gtagEvent({ event: GTagEvents.CITATION_EXTERNAL });
                  }}
                  rel='noopener noreferrer'
                />
              );
            }

            if (props.href?.startsWith('#')) {
              return (
                <Link
                  {...props}
                  className={linkClassName}
                  onClick={() => {
                    gtagEvent({ event: GTagEvents.CITATION_INTERNAL });
                  }}
                  href={props.href}
                />
              );
            }

            return <a {...props} className={linkClassName} />;
          },
        }}
      >
        {sanitizedText}
      </MemoizedReactMarkdown>
    </div>
  );
};

export default WonkAnswer;
