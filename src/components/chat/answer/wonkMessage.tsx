'use client';
import React from 'react';

import { StreamableValue } from 'ai/rsc';
import Link from 'next/link';
import remarkGfm from 'remark-gfm';

import { useGtagEvent } from '@/lib/hooks/useGtagEvent';
import {
  useStreamableText,
  useTempStreamableText,
} from '@/lib/hooks/useStreamableText';
import { MemoizedReactMarkdown } from '@/lib/markdown';
import { GTagEvents } from '@/models/gtag';

import { WonkPortrait } from '../rolePortrait';

import ChatActions from './chatActions';

export const WonkMessage = ({
  content,
  isLoading,
  wonkThoughts,
}: {
  content: string | StreamableValue<string>;
  isLoading: boolean;
  wonkThoughts: StreamableValue<string> | string;
}) => {
  const gtagEvent = useGtagEvent();
  const text = useStreamableText(content);
  const wonkText = useTempStreamableText(wonkThoughts);

  const sanitizedText = sanitizeMarkdown(text);

  return (
    <div className='row mb-3'>
      <div className='col-2 col-sm-1 mb-2'>
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
                  // external links should open in a new tab
                  if (props.href?.startsWith('http')) {
                    return (
                      <a
                        onClick={() => {
                          gtagEvent({
                            event: GTagEvents.CITATION_EXTERNAL,
                          });
                        }}
                        {...props}
                        target='_blank'
                        rel='noopener noreferrer'
                      />
                    );
                  }
                  // internal links might be footnotes and we want to handle them differently
                  else if (props.href?.startsWith('#')) {
                    const footnoteRef = Object.keys(props).find(
                      (key) => key === 'data-footnote-ref'
                    );

                    if (footnoteRef) {
                      // for footnote references, we want to show them in a superscript
                      return <sup>{props.children}</sup>;
                    }

                    const footnoteBackRef = Object.keys(props).find(
                      (key) => key === 'data-footnote-backref'
                    );

                    if (footnoteBackRef) {
                      // don't render the backref
                      return null;
                    }

                    // other internal links should be handled by next/link
                    return (
                      <Link
                        onClick={() => {
                          gtagEvent({
                            event: GTagEvents.CITATION_INTERNAL,
                          });
                        }}
                        {...props}
                        href={props.href || '#'}
                      />
                    );
                  } else {
                    // regular links (like mailto:)
                    return <a {...props} />;
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
      {!isLoading && <ChatActions />}
    </div>
  );
};

const stripTemporaryCitations = (content: string) => {
  // temporary citations are of the form <c:1234>
  // we want to strip these out so they aren't shown
  return content.replace(/<c:\d+>/g, '');
};

// fix up common markdown issues
const sanitizeMarkdown = (content: string) => {
  content = stripTemporaryCitations(content);

  return content;
};
