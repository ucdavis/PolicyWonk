import { Message } from 'ai';
import remarkGfm from 'remark-gfm';

import { MemoizedReactMarkdown } from './markdown';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  return (
    <div>
      <MemoizedReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node, ...props }) => {
            // open links in new tab but not for internal links
            if (props.href?.startsWith('http')) {
              return <a {...props} target='_blank' rel='noopener noreferrer' />;
            } else {
              return <a {...props} />;
            }
          },
        }}
      >
        {message.content}
      </MemoizedReactMarkdown>
    </div>
  );
}
