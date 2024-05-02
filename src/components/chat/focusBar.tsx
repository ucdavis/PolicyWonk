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
      <div className='focus-bar mt-4' onClick={() => setOpen(true)}>
        <div className='d-flex justify-content-start align-items-center'>
          <span className='btn btn-link'>Focus: {focus.name}</span>
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
