'use client';
import React from 'react';

import { StreamableValue } from 'ai/rsc';

import WonkyError from '@/lib/error/wonkyError';
import WonkyErrorBoundary from '@/lib/error/wonkyErrorBoundary';
import { useStreamableText } from '@/lib/hooks/useStreamableText';

import { WonkPortrait } from '../rolePortrait';

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
  const wonkText = useStreamableText(wonkThoughts, false);

  return (
    <div className='row mb-3'>
      <div className='col-2 col-sm-1 mb-2'>
        <WonkyErrorBoundary>
          <WonkPortrait isLoading={isLoading} />
        </WonkyErrorBoundary>
      </div>
      <div className='col-10 gtag'>
        <p className='chat-name'>
          <strong>Policy Wonk</strong>
        </p>
        <div>
          {text ? (
            <WonkyErrorBoundary
              fallback={
                <WonkyError type='alert' thereWasAnErrorLoadingThe='answer' />
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
