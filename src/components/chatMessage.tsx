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
          a: ({ node, ...props }) => (
            <a {...props} target='_blank' rel='noopener noreferrer' />
          ),
        }}
      >
        {message.content}
      </MemoizedReactMarkdown>
    </div>
  );
}
