'use client';
import React from 'react';

import { faThumbsUp, faThumbsDown } from '@fortawesome/free-regular-svg-icons';
import {
  faThumbsUp as faThumbsUpSolid,
  faThumbsDown as faThumbsDownSolid,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { throwConfettiAt } from '../../../lib/confetti';
import { submitFeedback } from '../../../lib/actions';
import { useGtagEvent } from '../../../lib/hooks/useGtagEvent';
import { ChatHistory, Feedback } from '../../../models/chat';
import { GTagEvents } from '../../../models/gtag';
import AnimatedButton from '../../ui/animatedButton';

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

  const thumbsUpRef = React.useRef<HTMLButtonElement>(null);

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
      <AnimatedButton
        buttonRef={thumbsUpRef}
        displayBeforeClick={<FontAwesomeIcon icon={faThumbsUp} />}
        displayOnClick={<FontAwesomeIcon icon={faThumbsUpSolid} />}
        onClick={() => {
          throwConfettiAt(thumbsUpRef.current);
          onFeedback('thumbs_up');
        }}
        disabled={!!feedback}
        selected={feedback === 'thumbs_up'}
      />
      <AnimatedButton
        displayBeforeClick={<FontAwesomeIcon icon={faThumbsDown} />}
        displayOnClick={<FontAwesomeIcon icon={faThumbsDownSolid} />}
        onClick={() => onFeedback('thumbs_down')}
        disabled={!!feedback}
        selected={feedback === 'thumbs_down'}
      />
    </>
  );
};

export default FeedbackButtons;
