'use client';
import React from 'react';

import { StreamableValue } from 'ai/rsc';

import ErrorBoundary from '@/lib/error/errorBoundary';
import WonkError from '@/lib/error/wonkError';
import {
  useStreamableText,
  useTempStreamableText,
} from '@/lib/hooks/useStreamableText';

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
  const wonkText = useTempStreamableText(wonkThoughts);

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
            <ErrorBoundary
              fallback={
                <WonkError type='alert' thereWasAnErrorLoadingThe='answer' />
              }
            >
              <WonkAnswer text={text} />
            </ErrorBoundary>
          ) : (
            wonkText
          )}
        </div>
      </div>
      {!isLoading && <ChatActions />}
    </div>
  );
};
