'use client';
import React from 'react';

import { faThumbsUp, faThumbsDown } from '@fortawesome/free-regular-svg-icons';
import {
  faThumbsUp as faThumbsUpSolid,
  faThumbsDown as faThumbsDownSolid,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { submitFeedback } from '../../../lib/actions';
import { useGtagEvent } from '../../../lib/hooks/useGtagEvent';
import { ChatHistory, Feedback } from '../../../models/chat';
import { GTagEvents } from '../../../models/gtag';

export type FeedbackLoadingStates = '' | Feedback;

interface FeedbackButtonsProps {
  chat: ChatHistory;
  onReactionUpdate: (reaction: Feedback | undefined) => void;
}

const FeedbackButtons: React.FC<FeedbackButtonsProps> = ({
  chat,
  onReactionUpdate,
}) => {
  const { id: chatId, reaction: feedback } = chat;
  const gtagEvent = useGtagEvent();

  const onFeedback = async (newFeedback: Feedback) => {
    const updatedChat: ChatHistory = {
      ...chat,
      reaction: newFeedback,
    };
    // optimistically update state
    onReactionUpdate(newFeedback);

    gtagEvent({
      event:
        newFeedback === 'thumbs_up'
          ? GTagEvents.FEEDBACK_THUMBS_UP
          : GTagEvents.FEEDBACK_THUMBS_DOWN,
      chat: updatedChat,
    });

    try {
      await submitFeedback(chatId, newFeedback);
    } catch (e) {
      // TODO: handle error
      onReactionUpdate(undefined);
    }
  };

  return (
    <>
      <button
        type='button'
        className={`btn btn-ghost btn-lg btn-square mr-1 bg-transparent text-base-content/60 shadow-none hover:bg-transparent hover:text-primary active:bg-transparent disabled:bg-transparent ${
          feedback === 'thumbs_up' ? 'text-primary' : ''
        }`}
        onClick={() => {
          onFeedback('thumbs_up');
        }}
        disabled={!!feedback}
        aria-label='Helpful response'
        title='Helpful response'
      >
        <FontAwesomeIcon
          icon={feedback === 'thumbs_up' ? faThumbsUpSolid : faThumbsUp}
        />
      </button>
      <button
        type='button'
        className={`btn btn-ghost btn-lg btn-square mr-1 bg-transparent text-base-content/60 shadow-none hover:bg-transparent hover:text-primary active:bg-transparent disabled:bg-transparent ${
          feedback === 'thumbs_down' ? 'text-primary' : ''
        }`}
        onClick={() => onFeedback('thumbs_down')}
        disabled={!!feedback}
        aria-label='Unhelpful response'
        title='Unhelpful response'
      >
        <FontAwesomeIcon
          icon={feedback === 'thumbs_down' ? faThumbsDownSolid : faThumbsDown}
        />
      </button>
    </>
  );
};

export default FeedbackButtons;
