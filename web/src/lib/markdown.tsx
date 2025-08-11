import { FC, memo } from 'react';

import ReactMarkdown, { Options } from 'react-markdown';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';

export const MemoizedReactMarkdown: FC<Options> = memo(
  (props: Options) => (
    <div className='prose prose-sm max-w-none markdown'>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSlug, rehypeAutolinkHeadings]}
        components={{
          table: (p) => (
            <table {...p} className={`markdown-table ${p.className ?? ''}`} />
          ),
          thead: ({ node, ...p }) => <thead {...p} className='bg-gray-50' />,
          th: ({ node, ...p }) => (
            <th
              {...p}
              className='border border-gray-300 p-2 text-left align-top break-words'
            />
          ),
          td: ({ node, ...p }) => (
            <td
              {...p}
              className='border border-gray-300 p-2 align-top break-words'
            />
          ),
          a: ({ node, ...p }) => <a {...p} className='break-all underline' />,
          code: ({ node, inline, ...p }: { node?: any; inline?: boolean }) =>
            inline ? (
              <code {...p} className='break-words' />
            ) : (
              <code {...p} className='block whitespace-pre-wrap break-words' />
            ),
          pre: ({ node, ...p }) => (
            <pre {...p} className='whitespace-pre-wrap break-words' />
          ),
          img: ({ node, ...p }) => <img {...p} className='max-w-full h-auto' />,
        }}
        {...props}
      />
    </div>
  ),
  (prev, next) =>
    prev.children === next.children && prev.className === next.className
);
