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
import { Feedback } from '@/models/chat';

import { WonkPortrait } from '../rolePortrait';

import ChatActions from './chatActions';

export const WonkMessage = ({
  chatId,
  content,
  isLoading,
  wonkThoughts,
  feedback,
}: {
  chatId: string;
  content: string | StreamableValue<string>;
  isLoading: boolean;
  wonkThoughts: StreamableValue<string> | string;
  feedback?: Feedback;
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

const cleanBracketedExpression = (str: string) => {
  return str.replace(/\[\^([^\]]+)\]/g, (fullMatch, innerContent) => {
    // Remove all non-word characters (except digits and underscore) and spaces from the innerContent
    const cleanedContent = innerContent.replace(/[\W_]+/g, '');
    return '[^' + cleanedContent + ']';
  });
};

const cleanBadCitationList = (str: string) => {
  // sometimes the llm lists citations w/ `- [^APM 015]` and we need to dump the `- `
  return str.replace(/- \[\^([^\]]+)\]/g, '[^$1]');
};

// fix up common markdown issues
const sanitizeMarkdown = (content: string) => {
  // if we see a footnote like `[^APM 015]` we need strip any non-word characters and spaces
  content = cleanBracketedExpression(content);
  content = cleanBadCitationList(content);

  return content;
};
