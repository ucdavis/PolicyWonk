'use client';
import React from 'react';

import { StreamableValue } from 'ai/rsc';
import Link from 'next/link';
import remarkGfm from 'remark-gfm';

import {
  useStreamableText,
  useTempStreamableText,
} from '@/lib/hooks/use-streamable-text';

import Feedback from './feedback';
import { MemoizedReactMarkdown } from './markdown';
import { WonkPortrait } from './rolePortrait';

export const WonkMessage = ({
  chatId,
  content,
  isLoading,
  wonkThoughts,
}: {
  chatId: string;
  content: string | StreamableValue<string>;
  isLoading: boolean;
  wonkThoughts: StreamableValue<string> | string;
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
                a: ({ node, ...props }) => {
                  // open links in new tab but not for internal links
                  if (props.href?.startsWith('http')) {
                    return (
                      <a {...props} target='_blank' rel='noopener noreferrer' />
                    );
                  } else {
                    return <Link {...props} href={props.href || '#'} />;
                  }
                },
              }}
            >
              {text}
            </MemoizedReactMarkdown>
          ) : (
            wonkText
          )}
        </div>
      </div>
      {/* TODO: have feedback not take a sec to load when refreshing? and UCD logo? */}
      {!isLoading && <Feedback chatId={chatId} />}
    </div>
  );
};
