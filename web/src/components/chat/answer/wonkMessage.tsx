'use client';
import React from 'react';

import { StreamableValue } from '@ai-sdk/rsc';

import WonkyClientError from '../../../lib/error/wonkyClientError';
import WonkyErrorBoundary from '../../../lib/error/wonkyErrorBoundary';
import { useStreamableText } from '../../../lib/hooks/useStreamableText';

import ChatActions from './chatActions';
import WonkAnswer from './wonkAnswer';

export const WonkMessage = ({
  content,
  isLoading,
  wonkThoughts,
}: {
  content: string | StreamableValue<string>;
  isLoading: boolean;
  wonkThoughts: StreamableValue<string> | string;
}) => {
  const text = useStreamableText(content);
  const wonkText = useStreamableText(wonkThoughts, { shouldAppend: false });

  return (
    <div className='chat-row'>
      <div className='d-flex'>
        <div>
          {text ? (
            <WonkyErrorBoundary
              fallback={
                <WonkyClientError
                  type='alert'
                  thereWasAnErrorLoadingThe='answer'
                />
              }
            >
              <WonkAnswer text={text} />
            </WonkyErrorBoundary>
          ) : (
            wonkText
          )}
        </div>
      </div>
      {!isLoading && <ChatActions />}
    </div>
  );
};
