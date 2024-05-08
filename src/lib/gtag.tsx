'use client';

import { sendGTMEvent } from '@next/third-parties/google';

import { Feedback } from '@/models/chat';

export interface GTagFeedback {
  event: 'feedback';
  feedback: Feedback;
}

export interface GTagChat {
  event: 'chat';
  focus: string;
  subFocus?: string;
}

const gtagEvent = (event: GTagChat | GTagFeedback) => {
  sendGTMEvent(event);
};

export default gtagEvent;
