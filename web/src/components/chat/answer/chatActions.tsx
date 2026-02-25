'use client';
import React from 'react';

import { AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

import WonkyErrorBoundary from '../../../lib/error/wonkyErrorBoundary';
import { useGtagEvent } from '../../../lib/hooks/useGtagEvent';
import { getFullQuestionAndAnswer } from '../../../lib/util';
import type { ChatHistory } from '../../../models/chat';
import { GTagEvents } from '../../../models/gtag';
import CopyToClipboardButton from '../../ui/copyToClipboardButton';

import FeedbackBar from './feedbackBar';
import FeedbackButtons from './feedbackButtons';
import ShareModal from './shareModal';

interface ChatActionsProps {
  chat: ChatHistory;
  onReactionUpdate: (reaction: ChatHistory['reaction']) => void;
  onShareIdUpdate: (shareId: ChatHistory['shareId']) => void;
}

const ChatActions: React.FC<ChatActionsProps> = ({
  chat,
  onReactionUpdate,
  onShareIdUpdate,
}) => {
  const gtagEvent = useGtagEvent();
  const pathname = usePathname();
  const onSharedPage = pathname.includes('/share/');
  const fullQuestionAndAnswer = React.useMemo(
    () => getFullQuestionAndAnswer(chat.messages),
    [chat.messages]
  );

  return (
    <>
      <div className='d-flex'>
        <WonkyErrorBoundary>
          <CopyToClipboardButton
            id='gtag-copy-chat'
            value={fullQuestionAndAnswer}
            onClick={() => {
              gtagEvent({ event: GTagEvents.COPY_CHAT, chat });
            }}
          />
        </WonkyErrorBoundary>
        {!onSharedPage && (
          <>
            <WonkyErrorBoundary>
              <FeedbackButtons
                chat={chat}
                onReactionUpdate={onReactionUpdate}
              />
            </WonkyErrorBoundary>
            <WonkyErrorBoundary>
              <ShareModal chat={chat} onShareIdUpdate={onShareIdUpdate} />
            </WonkyErrorBoundary>
          </>
        )}
      </div>
      <AnimatePresence initial={false}>
        {!onSharedPage && !!chat.reaction && (
          <WonkyErrorBoundary>
            <FeedbackBar />
          </WonkyErrorBoundary>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatActions;
