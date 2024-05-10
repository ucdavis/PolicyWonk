'use client';

import { sendGTMEvent } from '@next/third-parties/google';

import { Feedback } from '@/models/chat';

export interface GTagFeedback {
  event: 'feedback';
  feedback: Feedback;
}

export interface GTagFeedbackPositive {
  event: 'feedback_thumbs_up';
}

export interface GTagFeedbackNegative {
  event: 'feedback_thumbs_down';
}

export interface GTagChat {
  event: 'chat';
  focus: string;
  subFocus?: string;
}

const gtagEvent = (
  event: GTagChat | GTagFeedback | GTagFeedbackPositive | GTagFeedbackNegative
) => {
  sendGTMEvent(event);
};

export default gtagEvent;
