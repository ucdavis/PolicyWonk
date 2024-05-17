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
import { AnimatedBounceIcon } from '@/components/ui/animatedIcons';
import { AI } from '@/lib/actions';
import { GTagEvents, gtagEvent } from '@/lib/gtag';
import { Feedback } from '@/models/chat';

export type FeedbackLoadingStates = '' | Feedback;

interface FeedbackButtonsProps {
  onSharedPage: boolean;
}

const FeedbackButtons: React.FC<FeedbackButtonsProps> = ({ onSharedPage }) => {
  const [aiState] = useAIState<typeof AI>();
  const { id: chatId, reaction: feedback } = aiState;
  const { submitFeedback } = useActions<typeof AI>();

  const [loadingState, setLoadingState] =
    React.useState<FeedbackLoadingStates>('');

  const onFeedback = async (feedback: Feedback) => {
    if (onSharedPage) {
      return;
    }
    setLoadingState(feedback);
    gtagEvent({
      event: GTagEvents.FEEDBACK,
      chat: aiState,
    });

    await submitFeedback(chatId, feedback);

    setLoadingState('');
  };

  return (
    <>
      <AnimatedButton
        displayBeforeClick={
          <AnimatedBounceIcon
            isAnimating={loadingState === 'thumbs_up'}
            icon={faThumbsUp}
          />
        }
        displayOnClick={<FontAwesomeIcon icon={faThumbsUpSolid} />}
        onClick={() => onFeedback('thumbs_up')}
        disabled={loadingState !== ''}
        selected={feedback === 'thumbs_up'}
      />
      <AnimatedButton
        displayBeforeClick={
          <AnimatedBounceIcon
            isAnimating={loadingState === 'thumbs_down'}
            icon={faThumbsDown}
          />
        }
        displayOnClick={<FontAwesomeIcon icon={faThumbsDownSolid} />}
        onClick={() => onFeedback('thumbs_down')}
        disabled={loadingState !== ''}
        selected={feedback === 'thumbs_down'}
      />
    </>
  );
};

export default FeedbackButtons;
