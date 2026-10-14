'use client';
import React from 'react';

import WonkyClientError from '../../../lib/error/wonkyClientError';
import WonkyErrorBoundary from '../../../lib/error/wonkyErrorBoundary';
import { Focus, FocusName } from '../../../models/focus';

import UnionSelection from './unionSelection';

interface FocusOptionsProps {
  group: string;
  open: boolean;
  focus: Focus; // currently selected focus
  options: Focus[];
  onSelection: (selection?: Focus) => void;
}

const FocusOptions: React.FC<FocusOptionsProps> = ({
  group,
  open,
  focus,
  onSelection,
  options,
}) => {
  // if the focus is unions, we need to show the sub focus options
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const [subFocusType, setSubFocusType] = React.useState<FocusName>();

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const clearSubFocus = () => {
    setSubFocusType(undefined);
  };

  const onClose = () => {
    clearSubFocus();
    onSelection();
  };

  const closeDialog = () => dialogRef.current?.close();

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
      return (
        <UnionSelection
          key={group}
          group={group}
          onSelection={subFocusSelection}
        />
      );
    } else {
      return (
        <div className='py-2'>
          <div className='grid gap-3 md:grid-cols-2'>
            {options.map((option) => (
              <div key={option.name}>
                <button
                  type='button'
                  className={`flex min-h-28 w-full flex-col items-start rounded-box border border-main-border bg-base-100 p-4 text-left transition hover:border-primary hover:shadow-sm ${
                    option.name === focus.name
                      ? 'border-primary bg-primary/5'
                      : ''
                  }`}
                  onClick={() => onFocusSelection(option)}
                >
                  <span className='font-semibold uppercase'>{option.name}</span>
                  <span className='mt-2 text-sm text-base-content/70'>
                    {option.description}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className='modal'
      aria-modal='true'
      aria-labelledby='focus-options-title'
      onClose={onClose}
    >
      <div className='modal-box max-w-3xl border border-main-border bg-base-100 p-0'>
        <div className='flex items-center justify-between gap-4 border-b border-main-border bg-base-200 px-4 py-4 sm:px-6'>
          <h2
            id='focus-options-title'
            className='min-w-0 text-lg font-semibold'
          >
            Choose a focus for your question
          </h2>
          <button
            type='button'
            className='btn btn-ghost btn-sm btn-circle'
            onClick={closeDialog}
            aria-label='Close focus options'
          >
            ✕
          </button>
        </div>
        <div className='p-4 sm:p-6'>
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
        </div>
      </div>
      <form method='dialog' className='modal-backdrop'>
        <button type='submit'>Close</button>
      </form>
    </dialog>
  );
};

export default FocusOptions;
