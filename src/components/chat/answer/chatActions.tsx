'use client';
import React from 'react';

import { useAIState } from 'ai/rsc';
import { usePathname } from 'next/navigation';

import FeedbackBar from '@/components/chat/answer/feedbackBar';
import CopyToClipboardButton from '@/components/ui/copyToClipboardButton';
import { AI } from '@/lib/aiProvider';
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
  const fullQuestionAndAnswer = React.useMemo(
    () => getFullQuestionAndAnswer(aiState.messages),
    [aiState.messages]
  );

  return (
    <>
      <div className='row mb-3'>
        <div className='col-1'>{/* empty */}</div>
        <div className='col-11'>
          <CopyToClipboardButton
            id='gtag-copy-chat'
            value={fullQuestionAndAnswer}
            onClick={() => {
              gtagEvent({ event: GTagEvents.COPY_CHAT, chat: aiState });
            }}
          />
          {!onSharedPage && (
            <>
              <FeedbackButtons />
              <ShareModal />
            </>
          )}
        </div>
      </div>
      {!onSharedPage && !!aiState.reaction && <FeedbackBar />}
    </>
  );
};

export default ChatActions;
