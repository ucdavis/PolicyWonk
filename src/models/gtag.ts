import { ChatHistory, Feedback } from '@/models/chat';

/* the properties here should use snake_case and exactly match what is set up in GTM */
export enum GTagEvents {
  // custom events (manually triggered using gtagEvent()
  FEEDBACK_THUMBS_UP = 'feedback_thumbs_up',
  FEEDBACK_THUMBS_DOWN = 'feedback_thumbs_down',
  OPEN_SHARE_MODAL = 'open_share_modal',
  SHARE = 'share',
  UNSHARE = 'unshare',
  REGEN_SHARE = 'regen_share',
  NEW_CHAT = 'new_chat',
  COPY_CHAT = 'copy_chat',
  COPY_SHARE = 'copy_share_url',
  CITATION_INTERNAL = 'citation_internal',
  CITATION_EXTERNAL = 'citation_external', // records citation_source, but not chat state

  /*
  // automatic events (triggered by user actions), e.g. page visit or button click 
  // Q: do we want any of these to be custom events, so we can pass along more data?
  // e.g. see if chat contents are copied from /chat/ or from /share/
  // or see what default question was clicked
  DEFAULT_QUESTION = 'default_question', // automatically triggered on click from id=gtag-default-question*
  ABOUT_PAGE = 'about_page_view', // automatically triggered on visit to /about
  SHARED_PAGE_VIEW = 'shared_page_view', // automatically triggered on visit to /share/*
  */
}

export interface GTagEventVariables {
  // if you add a new custom variable, remember to add it as a custom dimension in GA
  event: GTagEvents;
  feedback?: Feedback;
  focus?: string;
  sub_focus?: string;
  llm_model?: string;
  // citation_source?: string; // this is a custom dimension, but we don't need to send it directly, it is pulled from the target URL in GTM
}

export interface GTagEventProps {
  event: GTagEvents;
  chat?: ChatHistory;
}
