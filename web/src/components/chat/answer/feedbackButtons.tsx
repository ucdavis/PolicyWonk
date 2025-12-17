'use client';
import React from 'react';

import { useAIState, useActions } from '@ai-sdk/rsc';
import { faThumbsUp, faThumbsDown } from '@fortawesome/free-regular-svg-icons';
import {
  faThumbsUp as faThumbsUpSolid,
  faThumbsDown as faThumbsDownSolid,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { AI } from '../../../lib/aiProvider';
import { throwConfettiAt } from '../../../lib/confetti';
import { useGtagEvent } from '../../../lib/hooks/useGtagEvent';
import { ChatHistory, Feedback } from '../../../models/chat';
import { GTagEvents } from '../../../models/gtag';
import AnimatedButton from '../../ui/animatedButton';

export type FeedbackLoadingStates = '' | Feedback;

interface FeedbackButtonsProps {}

const FeedbackButtons: React.FC<FeedbackButtonsProps> = ({}) => {
  const [aiState, setAIState] = useAIState<typeof AI>();
  const { id: chatId, reaction: feedback } = aiState;
  const { submitFeedback } = useActions<typeof AI>();
  const gtagEvent = useGtagEvent();

  const thumbsUpRef = React.useRef<HTMLButtonElement>(null);

  const onFeedback = async (newFeedback: Feedback) => {
    const newAiState: ChatHistory = {
      ...aiState,
      reaction: newFeedback,
    };
    // optimistically update the AI state
    setAIState(newAiState);

    gtagEvent({
      event:
        newFeedback === 'thumbs_up'
          ? GTagEvents.FEEDBACK_THUMBS_UP
          : GTagEvents.FEEDBACK_THUMBS_DOWN,
      chat: newAiState,
    });

    try {
      await submitFeedback(chatId, newFeedback);
    } catch (e) {
      // TODO: handle error
      setAIState((currentAIState) => ({
        ...currentAIState,
        reaction: undefined, // unset the reaction on error
      }));
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
