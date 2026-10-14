'use client';
import React from 'react';

import { faCaretDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import WonkyErrorBoundary from '../../../lib/error/wonkyErrorBoundary';
import { Focus, getFocusesForGroup } from '../../../models/focus';

import FocusOptions from './focusOptions';

interface FocusBarProps {
  group: string; // group name, used to filter focuses
  focus: Focus; // currently selected focus
  onSelection: (selection: Focus) => void;
}

const FocusBar: React.FC<FocusBarProps> = ({ group, focus, onSelection }) => {
  const [open, setOpen] = React.useState(false);

  const filteredFocuses = getFocusesForGroup(group);

  // if the focus is not in the list of focuses for the group, we default to the first one
  if (!filteredFocuses.some((f) => f.name === focus.name)) {
    onSelection(filteredFocuses[0]);
  }

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
      <button
        type='button'
        className='mb-2 flex w-full flex-col items-start gap-1 rounded-box px-0 py-2 text-left hover:text-primary sm:flex-row sm:items-center sm:gap-2'
        onClick={() => setOpen(true)}
      >
        <span className='inline-flex shrink-0 items-center gap-2 font-semibold'>
          <FontAwesomeIcon icon={faCaretDown} />
          Focus: {focus.name}
        </span>
        <span className='min-w-0 text-sm text-base-content/65'>
          {focus.description}
        </span>
      </button>
      <WonkyErrorBoundary>
        <FocusOptions
          group={group}
          focus={focus}
          open={open}
          onSelection={onFocusSelection}
          options={filteredFocuses}
        />
      </WonkyErrorBoundary>
    </>
  );
};

export default FocusBar;
