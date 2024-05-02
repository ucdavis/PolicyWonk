import React from 'react';

import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'framer-motion';
import { Modal } from 'reactstrap';

interface ShareModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  shareId: string;
}

const ShareModal: React.FC<ShareModalProps> = ({}) => {
  return <Modal></Modal>;
};

export default ShareModal;
