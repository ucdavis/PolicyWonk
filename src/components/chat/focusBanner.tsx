'use client';
import React from 'react';

import { Focus } from '@/models/focus';

interface FocusBannerProps {
  focus: Focus;
}

// read-only version of focus bar that just shows the focus
const FocusBanner: React.FC<FocusBannerProps> = ({ focus }) => {
  if (!focus) {
    return null;
  }

  return (
    <div className='focus-bar mt-4' style={{ marginBottom: '20px' }}>
      <div className='d-flex justify-content-start align-items-center'>
        <span className='btn btn-link'>Focus: {focus.name}</span>
        <span className='text-muted small'>{focus.description}</span>
      </div>
    </div>
  );
};

export default FocusBanner;
