'use client';
import React from 'react';

import { useAIState } from 'ai/rsc';
import { usePathname } from 'next/navigation';

import FeedbackBar from '@/components/chat/answer/feedbackBar';
import CopyToClipboardButton from '@/components/ui/copyToClipboardButton';
import { AI } from '@/lib/aiProvider';
import ErrorBoundary from '@/lib/error/errorBoundary';
import { useGtagEvent } from '@/lib/hooks/useGtagEvent';
import { getFullQuestionAndAnswer } from '@/lib/util';
import { GTagEvents } from '@/models/gtag';

import FeedbackButtons from './feedbackButtons';
import ShareModal from './shareModal';

interface ChatActionsProps {}

const ChatActions: React.FC<ChatActionsProps> = ({}) => {
  const gtagEvent = useGtagEvent();
  const pathname = usePathname();
  const onSharedPage = pathname.includes('/share/');
  const [aiState] = useAIState<typeof AI>();

  return (
    <>
      <div className='row mb-3'>
        <div className='col-1'>{/* empty */}</div>
        <div className='col-11'>
          <ErrorBoundary>
            <CopyToClipboardButton
              id='gtag-copy-chat'
              value={getFullQuestionAndAnswer(aiState)}
              onClick={() => {
                gtagEvent({ event: GTagEvents.COPY_CHAT, chat: aiState });
              }}
            />
          </ErrorBoundary>
          {!onSharedPage && (
            <>
              <ErrorBoundary>
                <FeedbackButtons />
              </ErrorBoundary>
              <ErrorBoundary>
                <ShareModal />
              </ErrorBoundary>
            </>
          )}
        </div>
      </div>
      {!onSharedPage && !!aiState.reaction && (
        <ErrorBoundary>
          <FeedbackBar />
        </ErrorBoundary>
      )}
    </>
  );
};

export default ChatActions;
