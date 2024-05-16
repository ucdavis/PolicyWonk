'use client';
import React from 'react';

import { useAIState } from 'ai/rsc';
import { usePathname } from 'next/navigation';

import FeedbackBar from '@/components/chat/answer/feedbackBar';
import CopyToClipboardButton from '@/components/ui/copyToClipboardButton';
import { AI } from '@/lib/actions';
import { gtagEvent, GTagEvents } from '@/lib/gtag';
import { getFullQuestionAndAnswer } from '@/lib/util';
import { Feedback } from '@/models/chat';
import { saveReaction } from '@/services/historyService';

import FeedbackButtons from './feedbackButtons';
import ShareModal from './shareModal';

interface ChatActionsProps {
  chatId: string;
  feedback?: Feedback;
}

const ChatActions: React.FC<ChatActionsProps> = ({ chatId, feedback }) => {
  // we only show actions when streaming is done, so it's safe to use AI state
  const [aiState] = useAIState<typeof AI>();
  const aiFeedback = aiState.reaction;
  const [feedbackSent, setFeedbackSent] = React.useState<null | Feedback>(
    feedback ?? aiFeedback ?? null
  );
  const pathname = usePathname();
  const onSharedPage = pathname.includes('/share/');

  const onFeedback = async (feedback: Feedback) => {
    if (onSharedPage) {
      return;
    }
    setFeedbackSent(feedback);

    gtagEvent({ event: GTagEvents.FEEDBACK, chat: aiState });

    await saveReaction(chatId, feedback);
  };

  return (
    <>
      <div className='row mb-3'>
        <div className='col-1'>{/* empty */}</div>
        <div className='col-11'>
          <CopyToClipboardButton
            id='gtag-copy-chat'
            value={getFullQuestionAndAnswer(aiState)}
          />
          {!onSharedPage && (
            <>
              <FeedbackButtons
                feedback={feedbackSent}
                onFeedback={onFeedback}
                disableFeedback={feedbackSent !== null}
              />
              <ShareModal />
            </>
          )}
        </div>
      </div>
      {!onSharedPage && feedbackSent && <FeedbackBar />}
    </>
  );
};

export default ChatActions;
