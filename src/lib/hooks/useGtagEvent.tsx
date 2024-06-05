'use client';
import { useCallback } from 'react';

import { sendGTMEvent } from '@next/third-parties/google';

import { GTagEventProps, GTagEventVariables } from '../../models/gtag';

/* takes in the name of the event and the full AI state, and then extracts the variables we have set up in GTM */
export const useGtagEvent = () => {
  const gtagEvent = useCallback(({ event, chat }: GTagEventProps) => {
    const eventObj: GTagEventVariables = {
      event,
      focus: chat?.focus?.name,
      sub_focus: chat?.focus?.subFocus,
      feedback: chat?.reaction,
      llm_model: chat?.llmModel,
    };

    sendGTMEvent(eventObj);
  }, []);

  return gtagEvent;
};
