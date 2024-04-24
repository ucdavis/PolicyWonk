import React from 'react';

import { faThumbsUp, faThumbsDown } from '@fortawesome/free-regular-svg-icons';
import {
  faThumbsUp as faThumbsUpSolid,
  faThumbsDown as faThumbsDownSolid,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import AnimatedButton from '../ui/animatedButton';

interface FeedbackButtonsProps {
  onFeedback: (feedback: 'thumbs_up' | 'thumbs_down') => void;
  disableFeedback: boolean;
}

const FeedbackButtons: React.FC<FeedbackButtonsProps> = ({
  onFeedback,
  disableFeedback,
}) => {
  return (
    <>
      <AnimatedButton
        displayBeforeClick={<FontAwesomeIcon icon={faThumbsUp} />}
        displayAfterClick={<FontAwesomeIcon icon={faThumbsUpSolid} />}
        onClick={() => onFeedback('thumbs_up')}
        disabled={disableFeedback}
      />
      <AnimatedButton
        displayBeforeClick={<FontAwesomeIcon icon={faThumbsDown} />}
        displayAfterClick={<FontAwesomeIcon icon={faThumbsDownSolid} />}
        onClick={() => onFeedback('thumbs_down')}
        disabled={disableFeedback}
      />
    </>
  );
};

export default FeedbackButtons;
