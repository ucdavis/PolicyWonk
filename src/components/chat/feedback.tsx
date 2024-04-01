import React from 'react';

import {
  faThumbsUp,
  faThumbsDown,
  faClipboardCheck,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { logReaction } from '@/services/loggingService';

type FeedbackProps = {
  chatId: string;
};

const Feedback = ({ chatId }: FeedbackProps) => {
  const [feedbackSent, setFeedbackSent] = React.useState(false);

  const onFeedback = async (feedback: string) => {
    setFeedbackSent(true);
    await logReaction(chatId, feedback);
  };

  if (feedbackSent) {
    return (
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
    );
  }

  return (
    <div className='row mb-3'>
      <div className='col-1'>{/* empty */}</div>
      <div className='col-11'>
        <div>
          <button
            className='btn-feedback me-1'
            onClick={() => onFeedback('thumbs_up')}
          >
            <FontAwesomeIcon icon={faThumbsUp} />
          </button>
          <button
            className='btn-feedback'
            onClick={() => onFeedback('thumbs_down')}
          >
            <FontAwesomeIcon icon={faThumbsDown} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Feedback;
