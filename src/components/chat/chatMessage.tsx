'use client';
import React from 'react';

import { StreamableValue, readStreamableValue } from 'ai/rsc';
import remarkGfm from 'remark-gfm';

import {
  useStreamableText,
  useTempStreamableText,
} from '@/lib/hooks/use-streamable-text';

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
  wonkThoughts,
}: {
  content: string | StreamableValue<string>;
  isLoading: boolean;
  wonkThoughts: StreamableValue<string>;
}) => {
  const text = useStreamableText(content);
  const wonkText = useTempStreamableText(wonkThoughts);

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
          {text ? (
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
          ) : (
            wonkText
          )}
        </div>
      </div>
    </div>
  );
};
