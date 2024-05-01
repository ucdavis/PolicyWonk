'use client';
import React from 'react';

import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

import { Focus } from './focusBar';

interface FocusOptionsProps {
  open: boolean;
  options: Focus[];
  onSelection: (selection?: Focus) => void;
}

const FocusOptions: React.FC<FocusOptionsProps> = ({
  open,
  onSelection,
  options,
}) => {
  const onClose = () => {
    onSelection();
  };
  return (
    <div>
      <Modal isOpen={open} toggle={onClose} centered>
        <ModalHeader toggle={onClose}>Focus Options</ModalHeader>
        <ModalBody>
          <div className='container py-2'>
            <div className='row g-4'>
              {options.map((option) => (
                <div className='col-md-4 col-lg-3' key={option.name}>
                  <div
                    className='card h-100 focus-card'
                    style={{ cursor: 'pointer' }}
                    onClick={() => onSelection(option)}
                  >
                    <div className='card-body'>
                      <h5 className='card-title'>{option.name}</h5>
                      <p className='card-text'>{option.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
};

export default FocusOptions;
