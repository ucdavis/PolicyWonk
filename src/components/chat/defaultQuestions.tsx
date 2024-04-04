import React from 'react';

import { useAIState, useActions, useUIState } from 'ai/rsc';
import { nanoid } from 'nanoid';

import { AI } from '@/lib/actions';

interface DefaultQuestionsProps {
  allowSend?: boolean;
  onQuestionSubmitted?: (question: string) => void;
}

const DefaultQuestions: React.FC<DefaultQuestionsProps> = ({
  allowSend,
  onQuestionSubmitted,
}) => {
  const [aiState] = useAIState();
  const [messages, setMessages] = useUIState<typeof AI>();
  // instead of passing in a submit function, we use a server action defined in actions.tsx when we create the AI
  const { submitUserMessage } = useActions();
  const questions = [
    'Do I need approval to work from home?',
    'What is extended leave?',
    'What are the official campus holidays?',
    'When must security updates be installed?',
  ];
  return (
<<<<<<< HEAD
    <div className='input-group d-flex flex-wrap justify-content-between'>
      {questions.map((example, index) => (
        <button
          key={index}
          className='form-control me-2 mb-2 btn btn-wonk text-start color-secondary-font'
          style={{ flex: '0 0 48%' }} // i dont know the right way to flex and account for margin
          onClick={async () => {
            setMessages((currentMessages) => [
              ...currentMessages,
              {
                id: nanoid(),
                display: <div>{example}</div>,
              },
            ]);

            const responseMessage = await submitUserMessage(example);

            setMessages((currentMessages) => [
              ...currentMessages,
              responseMessage,
            ]);
=======
    <div className='d-grid d-md-block'>
      {questions.map((question, index) => (
        <button
          key={index}
          className='btn btn-wonk text-start color-secondary-font'
          onClick={() => {
            onQuestionSubmitted(question);
>>>>>>> main
          }}
          // disabled={!allowSend}
        >
          {example}
        </button>
      ))}
    </div>
  );
};

export default DefaultQuestions;
