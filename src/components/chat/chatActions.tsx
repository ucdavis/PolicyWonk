'use client';
import React from 'react';

import { faClipboardCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'framer-motion';

import { saveReaction } from '@/services/historyService';

import CopyToClipboardButton from '../ui/copyToClipboardButton';

import FeedbackButtons from './feedbackButtons';

interface ChatActionsProps {
  chatId: string;
  content: string;
}

const ChatActions: React.FC<ChatActionsProps> = ({ chatId, content }) => {
  // TODO: default to previously sent feedback
  // TODO: disable feedback when chat is shared
  const [feedbackSent, setFeedbackSent] = React.useState<
    null | 'thumbs_up' | 'thumbs_down'
  >(null);

  const onFeedback = async (feedback: 'thumbs_up' | 'thumbs_down') => {
    setFeedbackSent(feedback);
    // await saveReaction(chatId, feedback);
  };

  return (
    <>
      <div className='row mb-3'>
        <div className='col-1'>{/* empty */}</div>
        <div className='col-11'>
          <CopyToClipboardButton id={chatId} value={content} />
          <FeedbackButtons
            feedback={feedbackSent}
            onFeedback={onFeedback}
            disableFeedback={feedbackSent !== null}
          />
        </div>
      </div>
      {feedbackSent && (
        <motion.div
          className='row mb-3'
          initial={{ opacity: 0 }}
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
