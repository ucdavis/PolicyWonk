'use client';
import React from 'react';

import { useActions, useUIState } from 'ai/rsc';
import { nanoid } from 'nanoid';

import { AI } from '@/lib/actions';

import { UserMessage } from './userMessage';

interface DefaultQuestionsProps {}

const DefaultQuestions: React.FC<DefaultQuestionsProps> = ({}) => {
  const [_, setMessagesUI] = useUIState<typeof AI>();
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
            // TODO: move out into separate function
            // Optimistically add user message UI
            setMessagesUI((currentMessages) => [
              ...currentMessages,
              {
                id: nanoid(),
                display: <UserMessage>{question}</UserMessage>,
              },
            ]);

            const responseMessage = await submitUserMessage(question);

            setMessagesUI((currentMessages) => [
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
