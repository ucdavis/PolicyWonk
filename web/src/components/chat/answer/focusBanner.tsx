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
    <div className='focus-result'>
      <h4>{focus.name}</h4>
      <p>{focus.description}</p>
    </div>
  );
};

export default FocusBanner;
