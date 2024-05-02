'use client';
import React from 'react';

import { Modal, ModalHeader, ModalBody } from 'reactstrap';

import { Focus, FocusName } from '@/models/focus';

import UnionSelection from './unionSelection';

interface FocusOptionsProps {
  open: boolean;
  focus: Focus; // currently selected focus
  options: Focus[];
  onSelection: (selection?: Focus) => void;
}

const FocusOptions: React.FC<FocusOptionsProps> = ({
  open,
  focus,
  onSelection,
  options,
}) => {
  // if the focus is unions, we need to show the sub focus options
  const [subFocusType, setSubFocusType] = React.useState<FocusName>();

  const clearSubFocus = () => {
    setSubFocusType(undefined);
  };

  const onClose = () => {
    clearSubFocus();
    onSelection();
  };

  const onFocusSelection = (selection: Focus) => {
    if (selection.name === 'unions') {
      // if the selection is unions, we don't want to close the modal or call onSelection
      // we want to show the sub focus options
      setSubFocusType(selection.name);
    } else {
      clearSubFocus();
      onSelection(selection);
    }
  };

  const subFocusSelection = (
    type: FocusName,
    subFocus: string,
    description: string
  ) => {
    // find the focus option that matches the type
    const focus = options.find((option) => option.name === type);

    if (focus) {
      // should always find the focus
      clearSubFocus();
      onSelection({ ...focus, subFocus, description });
    } else {
      clearSubFocus();
      onSelection();
    }
  };

  const renderBody = () => {
    if (subFocusType) {
      return <UnionSelection focus={focus} onSelection={subFocusSelection} />;
    } else {
      return (
        <div className='container py-2'>
          <div className='row'>
            {options.map((option) => (
              <div className='col' key={option.name}>
                <div
                  className={`card h-100 focus-card ${option.name === focus.name ? 'selected-focus' : ''}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onFocusSelection(option)}
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
      );
    }
  };

  return (
    <Modal isOpen={open} toggle={onClose} centered>
      <ModalHeader toggle={onClose}>Focus Options</ModalHeader>
      <ModalBody>{renderBody()}</ModalBody>
    </Modal>
  );
};

export default FocusOptions;
