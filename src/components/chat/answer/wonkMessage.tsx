'use client';
import React from 'react';

import { StreamableValue } from 'ai/rsc';
import Link from 'next/link';
import remarkGfm from 'remark-gfm';

import {
  useStreamableText,
  useTempStreamableText,
} from '@/lib/hooks/useStreamableText';
import { MemoizedReactMarkdown } from '@/lib/markdown';

import { WonkPortrait } from '../rolePortrait';

import ChatActions from './chatActions';

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

  const sanitizedText = sanitizeMarkdown(text);

  return (
    <div className='row mb-3'>
      <div className='col-3 col-md-1 mb-2'>
        <WonkPortrait isLoading={isLoading} />
      </div>
      <div className='col-10 col-md-11 gtag'>
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
              {sanitizedText}
            </MemoizedReactMarkdown>
          ) : (
            wonkText
          )}
        </div>
      </div>
      {!isLoading && <ChatActions chatId={chatId} />}
    </div>
  );
};

const stripTemporaryCitations = (content: string) => {
  // temporary citations are of the form <c:1234>
  // we want to strip these out
  return content.replace(/<c:\d+>/g, '');
};

// fix up common markdown issues
const sanitizeMarkdown = (content: string) => {
  content = stripTemporaryCitations(content);

  return content;
};
