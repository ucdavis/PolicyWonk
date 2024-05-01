'use client';
import React from 'react';

import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

import { Focus } from './focusBar';

interface FocusOptionsProps {
  open: boolean;
  options: Focus[];
  onSelection: (selection?: Focus) => void;
}

const FocusOptions: React.FC<FocusOptionsProps> = ({ open, onSelection }) => {
  const onClose = () => {
    onSelection();
  };
  return (
    <div>
      <Modal isOpen={open} toggle={onClose} centered>
        <ModalHeader toggle={onClose}>Focus Options</ModalHeader>
        <ModalBody>Hello I'm a modal</ModalBody>
        <ModalFooter>
          <Button color='secondary' onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default FocusOptions;
