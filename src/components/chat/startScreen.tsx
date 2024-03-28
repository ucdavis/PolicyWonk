import React from 'react';

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
      <ChatHeader />
      <DefaultQuestions
        onQuestionSubmitted={onQuestionSubmitted}
        allowSend={!isLoading}
      />
    </>
  );
};

export default StartScreen;
