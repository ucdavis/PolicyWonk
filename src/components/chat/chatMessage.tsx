'use client';
import React from 'react';

import { StreamableValue } from 'ai/rsc';
import remarkGfm from 'remark-gfm';

import { useStreamableText } from '@/lib/hooks/use-streamable-text';

import { MemoizedReactMarkdown } from './markdown';
import { UserPortrait, WonkPortrait } from './rolePortrait';

export const UserMessage = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className='row mb-3'>
      <div className='col-3 col-md-1 mb-2'>
        <UserPortrait />
      </div>
      <div className='col-10 col-md-11'>
        <p className='chat-name'>
          <strong>{`You: `}</strong>
        </p>
        {children}
      </div>
    </div>
  );
};

export const WonkMessage = ({
  content,
  isLoading,
}: {
  content: string | StreamableValue<string>;
  isLoading: boolean;
}) => {
  const text = useStreamableText(content);

  return (
    <div className='row mb-3'>
      <div className='col-3 col-md-1 mb-2'>
        <WonkPortrait isLoading={isLoading} />
      </div>
      <div className='col-10 col-md-11'>
        <p className='chat-name'>
          <strong>Policy Wonk</strong>
        </p>
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
        </div>{' '}
      </div>
    </div>
  );
};
