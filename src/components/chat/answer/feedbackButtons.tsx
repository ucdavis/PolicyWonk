'use client';
import React from 'react';

import { faThumbsUp, faThumbsDown } from '@fortawesome/free-regular-svg-icons';
import {
  faThumbsUp as faThumbsUpSolid,
  faThumbsDown as faThumbsDownSolid,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAIState, useActions } from 'ai/rsc';

import AnimatedButton from '@/components/ui/animatedButton';
import { AI } from '@/lib/actions';
import { GTagEvents, gtagEvent } from '@/lib/gtag';
import { ChatHistory, Feedback } from '@/models/chat';

export type FeedbackLoadingStates = '' | Feedback;

interface FeedbackButtonsProps {}

const FeedbackButtons: React.FC<FeedbackButtonsProps> = ({}) => {
  const [aiState, setAIState] = useAIState<typeof AI>();
  const { id: chatId, reaction: feedback } = aiState;
  const { submitFeedback } = useActions<typeof AI>();

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
        displayBeforeClick={<FontAwesomeIcon icon={faThumbsUp} />}
        displayOnClick={<FontAwesomeIcon icon={faThumbsUpSolid} />}
        onClick={() => onFeedback('thumbs_up')}
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
