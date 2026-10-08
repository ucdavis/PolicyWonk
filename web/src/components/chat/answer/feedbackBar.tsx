import React from 'react';

import { faClipboardCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'framer-motion';

interface FeedbackBarProps {}

const FeedbackBar: React.FC<FeedbackBarProps> = ({}) => {
  return (
    <motion.div
      className='mb-3 ml-auto max-w-2xl'
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
      <div>
        <div className='alert alert-success flex items-center' role='alert'>
          <div className='mr-2'>
            <FontAwesomeIcon icon={faClipboardCheck} />
          </div>
          <div>Thank you for your feedback!</div>
        </div>
      </div>
    </motion.div>
  );
};

export default FeedbackBar;
