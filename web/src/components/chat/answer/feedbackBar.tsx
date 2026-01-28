import React from 'react';

import { faClipboardCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'framer-motion';

interface FeedbackBarProps {}

const FeedbackBar: React.FC<FeedbackBarProps> = ({}) => {
  return (
    <motion.div
      className='row mb-3'
      initial={{ opacity: 0.1, scale: 0 }}
      animate={{
        opacity: 1,
        scale: 1,
        transition: {
          stiffness: 90,
          damping: 7,
          type: 'spring',
        },
      }}
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
        <div>{/*empty */}</div>
      </div>
    </motion.div>
  );
};

export default FeedbackBar;
