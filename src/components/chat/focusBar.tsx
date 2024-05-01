'use client';
import React from 'react';

import { Button } from 'reactstrap';

import FocusOptions from './focusOptions';

export type Focus = {
  name: string;
  description: string;
};

const focuses: Focus[] = [
  {
    name: 'core',
    description: 'UCOP & Ellucid Policies (ppm, ppsm, delegations)',
  },
  {
    name: 'apm',
    description: 'Academic Personnel Manual',
  },
  {
    name: 'unions',
    description: 'UCOP Union Contracts',
  },
];

const FocusBar: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const [focus, setFocus] = React.useState<Focus>(focuses[0]);

  const onFocusSelection = (selection?: Focus) => {
    // on any selection we close the modal
    setOpen(false);

    // if a selection was made, we can do something with it
    if (selection) {
      setFocus(selection);
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
        open={open}
        onSelection={onFocusSelection}
        options={focuses}
      />
    </>
  );
};

export default FocusBar;
