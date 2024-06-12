'use client';
import React from 'react';

import { faFilter } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

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
      <div className='focus-wrapper'>
        <p>click to change focus</p>
        <div className='focus-bar' onClick={() => setOpen(true)}>
          <div className='d-flex justify-content-start align-items-center'>
            <span className='btn btn-link'>
              <FontAwesomeIcon icon={faFilter} />
              Focus: {focus.name}
            </span>
            <span className='text-muted small'>{focus.description}</span>
          </div>
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
