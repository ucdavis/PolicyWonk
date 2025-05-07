'use client';
import React from 'react';

import { Modal, ModalHeader, ModalBody, Button } from 'reactstrap';

import WonkyClientError from '../../../lib/error/wonkyClientError';
import WonkyErrorBoundary from '../../../lib/error/wonkyErrorBoundary';
import { Focus, FocusName } from '../../../models/focus';

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
        <div className='py-2'>
          <div className='row g-3'>
            {options.map((option) => (
              <div className='col-12 col-md-6 focus-option' key={option.name}>
                <Button
                  className={`btn btn-wonk ${option.name === focus.name ? 'selected-focus' : ''}`}
                  style={{ cursor: 'pointer' }}
                  color='none'
                  onClick={() => onFocusSelection(option)}
                >
                  <h4>{option.name}</h4>
                  <p>{option.description}</p>
                </Button>
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  return (
    <Modal isOpen={open} toggle={onClose} centered>
      <ModalHeader toggle={onClose}>
        Choose a focus for your question
      </ModalHeader>
      <ModalBody>
        <WonkyErrorBoundary
          fallback={
            <WonkyClientError
              type='alert'
              thereWasAnErrorLoadingThe='focus options'
            />
          }
        >
          {renderBody()}
        </WonkyErrorBoundary>
      </ModalBody>
    </Modal>
  );
};

export default FocusOptions;
