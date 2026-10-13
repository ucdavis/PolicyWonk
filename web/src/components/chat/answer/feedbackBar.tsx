import React from 'react';

import { faClipboardCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface FeedbackBarProps {}

const FeedbackBar: React.FC<FeedbackBarProps> = ({}) => {
  return (
    <div
      className='alert alert-success alert-soft mb-3 flex w-full items-center'
      role='alert'
    >
      <div className='mr-2'>
        <FontAwesomeIcon icon={faClipboardCheck} />
      </div>
      <div>Thank you for your feedback!</div>
    </div>
  );
};

export default FeedbackBar;
