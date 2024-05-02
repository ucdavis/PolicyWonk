'use client';
import React from 'react';

import { useAIState } from 'ai/rsc';
import { usePathname } from 'next/navigation';

import { AI } from '@/lib/actions';
import { Feedback } from '@/models/chat';
import { saveReaction, shareChat } from '@/services/historyService';

import CopyToClipboardButton from '../ui/copyToClipboardButton';

import FeedbackBar from './feedbackBar';
import FeedbackButtons from './feedbackButtons';
import ShareButton from './shareButton';

interface ChatActionsProps {
  chatId: string;
  content: string;
  feedback?: Feedback;
  shareId?: string;
}

const ChatActions: React.FC<ChatActionsProps> = ({
  chatId,
  content,
  feedback,
  shareId,
}) => {
  // TODO: default to previously sent feedback
  // TODO: disable feedback when chat is shared
  const [aiState] = useAIState<typeof AI>();
  const aiFeedback = aiState.reaction;
  const [feedbackSent, setFeedbackSent] = React.useState<null | Feedback>(
    feedback ?? aiFeedback ?? null
  );
  const pathname = usePathname();
  const shared = pathname.includes('/share/');

  const onFeedback = async (feedback: Feedback) => {
    setFeedbackSent(feedback);
    await saveReaction(chatId, feedback);
  };

  const onShare = async (chatId: string) => {
    const shareId = await shareChat(chatId);
    if (!shareId) return; // TODO: handle error sharing
    navigator.clipboard.writeText(`${window.location.origin}/share/${shareId}`);
    // TODO: toast?
  };

  return (
    <>
      <div className='row mb-3'>
        <div className='col-1'>{/* empty */}</div>
        <div className='col-11'>
          <CopyToClipboardButton id={chatId} value={content} />
          {!shared && (
            <>
              <FeedbackButtons
                feedback={feedbackSent}
                onFeedback={onFeedback}
                disableFeedback={feedbackSent !== null}
              />
              <ShareButton chatId={chatId} shareId={chatId} onShare={onShare} />
            </>
          )}
        </div>
      </div>
      {!shared && feedbackSent && <FeedbackBar />}
    </>
  );
};

export default ChatActions;
