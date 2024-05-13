import React from 'react';

import { faThumbsUp, faThumbsDown } from '@fortawesome/free-regular-svg-icons';
import {
  faThumbsUp as faThumbsUpSolid,
  faThumbsDown as faThumbsDownSolid,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import AnimatedButton from '@/components/ui/animatedButton';
import { Feedback } from '@/models/chat';

interface FeedbackButtonsProps {
  feedback: Feedback | null;
  onFeedback: (feedback: Feedback) => void;
  disableFeedback: boolean;
}

const FeedbackButtons: React.FC<FeedbackButtonsProps> = ({
  feedback,
  onFeedback,
  disableFeedback,
}) => {
  return (
    <>
      <AnimatedButton
        displayBeforeClick={<FontAwesomeIcon icon={faThumbsUp} />}
        displayOnClick={<FontAwesomeIcon icon={faThumbsUpSolid} />}
        onClick={() => onFeedback('thumbs_up')}
        disabled={disableFeedback}
        selected={feedback === 'thumbs_up'}
      />
      <AnimatedButton
        displayBeforeClick={<FontAwesomeIcon icon={faThumbsDown} />}
        displayOnClick={<FontAwesomeIcon icon={faThumbsDownSolid} />}
        onClick={() => onFeedback('thumbs_down')}
        disabled={disableFeedback}
        selected={feedback === 'thumbs_down'}
      />
    </>
  );
};

export default FeedbackButtons;
