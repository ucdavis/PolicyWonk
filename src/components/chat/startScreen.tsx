import React from 'react';

import WonkBottom from '../layout/wonkBottom';
import WonkTop from '../layout/wonkTop';

import ChatHeader from './chatHeader';
import DefaultQuestions from './defaultQuestions';

interface EmptyProps {
  onQuestionSubmitted: (question: string) => void;
  isLoading: boolean;
}

const StartScreen: React.FC<EmptyProps> = ({
  onQuestionSubmitted,
  isLoading,
}) => {
  return (
    <>
      <WonkTop>
        <ChatHeader />
      </WonkTop>
      <WonkBottom>
        <DefaultQuestions
          onQuestionSubmitted={onQuestionSubmitted}
          allowSend={!isLoading}
        />
      </WonkBottom>
    </>
  );
};

export default StartScreen;
