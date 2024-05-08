'use client';
import React from 'react';

import { useAIState } from 'ai/rsc';
import { usePathname } from 'next/navigation';

import { AI } from '@/lib/actions';
import { Feedback } from '@/models/chat';
import { saveReaction } from '@/services/historyService';

import Share from '../share/share';
import CopyToClipboardButton from '../ui/copyToClipboardButton';

import FeedbackBar from './feedbackBar';
import FeedbackButtons from './feedbackButtons';

interface ChatActionsProps {
  chatId: string;
  content: string;
  feedback?: Feedback;
}

const ChatActions: React.FC<ChatActionsProps> = ({
  chatId,
  content,
  feedback,
}) => {
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
    await saveReaction(chatId, feedback);
  };

  return (
    <>
      <div className='row mb-3'>
        <div className='col-1'>{/* empty */}</div>
        <div className='col-11'>
          <CopyToClipboardButton id={chatId} value={content} />
          {!onSharedPage && (
            <>
              <FeedbackButtons
                feedback={feedbackSent}
                onFeedback={onFeedback}
                disableFeedback={feedbackSent !== null}
              />
              <Share chatId={chatId} shareId={aiState.shareId} />
            </>
          )}
        </div>
      </div>
      {!onSharedPage && feedbackSent && <FeedbackBar />}
    </>
  );
};

export default ChatActions;
