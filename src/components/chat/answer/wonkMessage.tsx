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
      <div className='col-2 mb-2'>
        <WonkPortrait isLoading={isLoading} />
      </div>
      <div className='col-10 gtag'>
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

const reformatFootnotes = (markdown: string) => {
  // Regular expression to match a footnote pattern [^doc2]: with optional leading whitespaces or newlines
  const footnotePattern = /(?:\s*\n)?(\[\^\w+\]:\s*\[.*?\])/g;

  // Replace function to ensure each footnote starts on a new line
  const formattedMarkdown = markdown.replace(
    footnotePattern,
    (match) => `\n${match.trim()}`
  );

  // Trim any leading or trailing whitespace (to clear any excessive newlines at the start)
  return formattedMarkdown.trim();
};

// fix up common markdown issues
const sanitizeMarkdown = (content: string) => {
  content = cleanBracketedExpression(content);
  content = cleanBadCitationList(content);
  content = reformatFootnotes(content);

  return content;
};
