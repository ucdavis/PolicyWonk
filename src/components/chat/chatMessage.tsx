'use client';
import { useEffect, useState } from 'react';

import { Message } from 'ai';
import { StreamableValue, readStreamableValue } from 'ai/rsc';
import remarkGfm from 'remark-gfm';

import { useStreamableText } from '@/lib/hooks/use-streamable-text';

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

export function BotMessage({
  content,
  className,
}: {
  content: string | StreamableValue<string>;
  className?: string;
}) {
  const text = useStreamableText(content);

  return (
    <div className='bot-message' style={{ color: 'aquamarine' }}>
      <h3>Bot!</h3>
      {text}
    </div>
  );
}

export function UserMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className='user-message' style={{ color: 'greenyellow' }}>
      <h3>User!</h3>
      {children}
    </div>
  );
}
