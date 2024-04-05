import React from 'react';

import { useAIState, useActions, useUIState } from 'ai/rsc';
import { nanoid } from 'nanoid';

import { AI } from '@/lib/actions';

interface DefaultQuestionsProps {}

const DefaultQuestions: React.FC<DefaultQuestionsProps> = ({}) => {
  const [_, setMessages] = useUIState<typeof AI>();
  // instead of passing in a submit function, we use a server action defined in actions.tsx when we create the AI
  const { submitUserMessage } = useActions();
  const questions = [
    'Do I need approval to work from home?',
    'What is extended leave?',
    'What are the official campus holidays?',
    'When must security updates be installed?',
  ];
  return (
    <div className='d-grid d-md-block'>
      {questions.map((question, index) => (
        <button
          key={index}
          className='btn btn-wonk text-start color-secondary-font'
          onClick={async () => {
            const responseMessage = await submitUserMessage(question);

            setMessages((currentMessages) => [
              ...currentMessages,
              responseMessage,
            ]);
          }}
        >
          {question}
        </button>
      ))}
    </div>
  );
};

export default DefaultQuestions;
