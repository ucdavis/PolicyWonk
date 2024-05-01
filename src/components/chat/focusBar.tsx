'use client';
import React from 'react';

import { Button } from 'reactstrap';

import { Focus, focuses } from '@/models/focus';

import FocusOptions from './focusOptions';

interface FocusBarProps {
  focus: Focus; // currently selected focus
  options: Focus[]; // available focus options
  onSelection: (selection: Focus) => void;
}

const FocusBar: React.FC<FocusBarProps> = ({ focus, options, onSelection }) => {
  const [open, setOpen] = React.useState(false);

  const onFocusSelection = (selection?: Focus) => {
    // on any selection we close the modal
    setOpen(false);

    // if a selection was made, we can do something with it
    if (selection) {
      onSelection(selection);
    }
  };

  return (
    <>
      <div className='border'>
        <div className='d-flex justify-content-between align-items-center p-2'>
          <Button onClick={() => setOpen(true)}>Focus: {focus.name}</Button>
          <span className='text-muted small'>{focus.description}</span>
        </div>
      </div>

      <FocusOptions
        focus={focus}
        open={open}
        onSelection={onFocusSelection}
        options={focuses}
      />
    </>
  );
};

export default FocusBar;
