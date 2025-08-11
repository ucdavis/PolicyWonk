import { FC, memo } from 'react';

import ReactMarkdown, { Options } from 'react-markdown';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';

export const MemoizedReactMarkdown: FC<Options> = memo(
  (props: Options) => (
    <div>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSlug, rehypeAutolinkHeadings]}
        components={{
          table: (p) => (
            <table {...p} className={`markdown-table ${p.className ?? ''}`} />
          ),
          thead: ({ node, ...p }) => <thead {...p} />,
          th: ({ node, ...p }) => <th {...p} />,
          td: ({ node, ...p }) => <td {...p} />,
          a: ({ node, ...p }) => <a {...p} />,
          code: ({ node, inline, ...p }: { node?: any; inline?: boolean }) =>
            inline ? <code {...p} /> : <code {...p} />,
          pre: ({ node, ...p }) => <pre {...p} />,
          img: ({ node, ...p }) => <img {...p} />,
        }}
        {...props}
      />
    </div>
  ),
  (prev, next) =>
    prev.children === next.children && prev.className === next.className
);
