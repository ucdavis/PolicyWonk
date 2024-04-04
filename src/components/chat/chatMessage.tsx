'use client';
import { useEffect, useState } from 'react';

import { Message } from 'ai';
import { StreamableValue, readStreamableValue } from 'ai/rsc';
import remarkGfm from 'remark-gfm';

import { useStreamableText } from '@/lib/hooks/use-streamable-text';

import { MemoizedReactMarkdown } from './markdown';

interface ChatMessageProps {
  content: string | StreamableValue<string>;
}

export function ChatMessage({ content }: ChatMessageProps) {
  const text = useStreamableText(content);

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
        {text}
      </MemoizedReactMarkdown>
    </div>
  );
}
