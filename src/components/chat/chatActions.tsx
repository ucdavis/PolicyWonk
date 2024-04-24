'use client';
import React from 'react';

import { faThumbsUp, faThumbsDown } from '@fortawesome/free-regular-svg-icons';
import {
  faThumbsUp as faThumbsUpSolid,
  faThumbsDown as faThumbsDownSolid,
  faClipboardCheck,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Variants, motion } from 'framer-motion';

import { saveReaction } from '@/services/historyService';

import AnimatedButton from '../animatedButton';
import CopyToClipboardButton from '../CopyToClipboardButton';

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
    await saveReaction(chatId, feedback);
  };

  const disableFeedback = feedbackSent !== null;
  return (
    <>
      <div className='row mb-3'>
        <div className='col-1'>{/* empty */}</div>
        <div className='col-11'>
          <CopyToClipboardButton
            id={chatId}
            value={content}
            className='btn-feedback me-1'
          />
          <AnimatedButton
            id={chatId}
            displayBeforeClick={
              <FontAwesomeIcon title='Thumbs up' icon={faThumbsUp} />
            }
            displayAfterClick={
              <FontAwesomeIcon
                title='Thumbs up submitted'
                icon={faThumbsUpSolid}
              />
            }
            onClick={() => onFeedback('thumbs_up')}
            disabled={disableFeedback}
          />
          <AnimatedButton
            id={chatId}
            displayBeforeClick={
              <FontAwesomeIcon title='Thumbs down' icon={faThumbsDown} />
            }
            displayAfterClick={
              <FontAwesomeIcon
                title='Thumbs down submitted'
                icon={faThumbsDownSolid}
              />
            }
            onClick={() => onFeedback('thumbs_down')}
            disabled={disableFeedback}
          />
        </div>
      </div>
      {feedbackSent && (
        <div className='row mb-3'>
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
        </div>
      )}
    </>
  );
};

export default ChatActions;
