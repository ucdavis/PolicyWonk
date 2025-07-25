'use client';
import React from 'react';

import { useAIState } from 'ai/rsc';
import { AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

import { AI } from '../../../lib/aiProvider';
import WonkyErrorBoundary from '../../../lib/error/wonkyErrorBoundary';
import { useGtagEvent } from '../../../lib/hooks/useGtagEvent';
import { getFullQuestionAndAnswer } from '../../../lib/util';
import { GTagEvents } from '../../../models/gtag';
import CopyToClipboardButton from '../../ui/copyToClipboardButton';

import FeedbackBar from './feedbackBar';
import FeedbackButtons from './feedbackButtons';
import ShareModal from './shareModal';

const ChatActions: React.FC = () => {
  const gtagEvent = useGtagEvent();
  const pathname = usePathname();
  const onSharedPage = pathname.includes('/share/');
  const [aiState] = useAIState<typeof AI>();
  const fullQuestionAndAnswer = React.useMemo(
    () => getFullQuestionAndAnswer(aiState.messages),
    [aiState.messages]
  );

  return (
    <>
      <div className='d-flex'>
        <WonkyErrorBoundary>
          <CopyToClipboardButton
            id='gtag-copy-chat'
            value={fullQuestionAndAnswer}
            onClick={() => {
              gtagEvent({ event: GTagEvents.COPY_CHAT, chat: aiState });
            }}
          />
        </WonkyErrorBoundary>
        {!onSharedPage && (
          <>
            <WonkyErrorBoundary>
              <FeedbackButtons />
            </WonkyErrorBoundary>
            <WonkyErrorBoundary>
              <ShareModal />
            </WonkyErrorBoundary>
          </>
        )}
      </div>
      <AnimatePresence initial={false}>
        {!onSharedPage && !!aiState.reaction && (
          <WonkyErrorBoundary>
            <FeedbackBar />
          </WonkyErrorBoundary>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatActions;
