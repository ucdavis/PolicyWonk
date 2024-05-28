'use client';

import { sendGTMEvent } from '@next/third-parties/google';

import { ChatHistory, Feedback } from '@/models/chat';

/* the properties here should use snake_case and exactly match what is set up in GTM */
export enum GTagEvents {
  // custom events (manually triggered using gtagEvent()
  FEEDBACK_THUMBS_UP = 'feedback_thumbs_up',
  FEEDBACK_THUMBS_DOWN = 'feedback_thumbs_down',
  SHARE = 'share',
  UNSHARE = 'unshare',
  REGEN_SHARE = 'regen_share',
  NEW_CHAT = 'new_chat',

  /*
  // automatic events (triggered by user actions), e.g. page visit or button click 
  // Q: do we want any of these to be custom events, so we can pass along more data?
  // e.g. see if chat contents are copied from /chat/ or from /share/
  // or see what default question was clicked
  COPY_CHAT = 'copy_chat', // automatically triggered on click from id=gtag=copy-chat*
  COPY_SHARE = 'copy_share', // automatically triggered on click from id=gtag=copy-share-url*
  DEFAULT_QUESTION = 'default_question', // automatically triggered on click from id=gtag-default-question*
  ABOUT_PAGE = 'about_page', // automatically triggered on visit to /about
  SHARED_PAGE_VIEW = 'shared_page_view', // automatically triggered on visit to /share/*
  CITATION_CLICKED = 'citation_clicked', // automatically triggered on click from div.gtag a selector inside wonkMessage
  */
}

interface GTagEventVariables {
  event: GTagEvents;
  feedback?: Feedback;
  focus?: string;
  sub_focus?: string;
}

interface GTagEventProps {
  event: GTagEvents;
  chat?: ChatHistory;
}
/* takes in the name of the event and the full AI state, and then extracts the variables we have set up in GTM */
export const gtagEvent = ({ event, chat }: GTagEventProps): void => {
  const eventObj: GTagEventVariables = {
    event,
    focus: chat?.focus?.name,
    sub_focus: chat?.focus?.subFocus,
    feedback: chat?.reaction,
  };

  sendGTMEvent(eventObj);
};
