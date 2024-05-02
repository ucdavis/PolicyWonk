'use client';
import React from 'react';

import { faClipboardCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAIState } from 'ai/rsc';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

import { AI } from '@/lib/actions';
import { Feedback } from '@/models/chat';
import { saveReaction } from '@/services/historyService';

import CopyToClipboardButton from '../ui/copyToClipboardButton';

import FeedbackButtons from './feedbackButtons';
import ShareButtons from './shareButton';

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
              <ShareButtons
                chatId={chatId}
                shareId={chatId}
                onShare={() => {}}
              />
            </>
          )}
        </div>
      </div>
      {!shared && feedbackSent && (
        <motion.div
          className='row mb-3'
          initial={false}
          animate={{ opacity: 1 }}
        >
          <div className='col-1'>{/* empty */}</div>
          <div className='col-11'>
            <div
              className='alert alert-success d-flex align-items-center'
              role='alert'
            >
              <div className='me-2'>
                <FontAwesomeIcon icon={faClipboardCheck} />
              </div>
              <div>Thank you for your feedback!</div>
            </div>
            <div></div>
          </div>
        </motion.div>
      )}
    </>
  );
};

export default ChatActions;
