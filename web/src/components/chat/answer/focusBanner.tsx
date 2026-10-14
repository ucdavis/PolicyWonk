'use client';
import React from 'react';

import { Focus } from '../../../models/focus';

interface FocusBannerProps {
  focus: Focus;
}

// read-only version of focus bar that just shows the focus
const FocusBanner: React.FC<FocusBannerProps> = ({ focus }) => {
  if (!focus) {
    return null;
  }

  return (
    <div className='mb-8 border-r-4 border-main-border pr-3 text-right'>
      <h2 className='text-sm font-semibold uppercase text-base-content/75'>
        {focus.name}
      </h2>
      <p className='text-sm text-base-content/65'>{focus.description}</p>
    </div>
  );
};

export default FocusBanner;
