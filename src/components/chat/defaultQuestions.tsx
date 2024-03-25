import React from 'react';

interface DefaultQuestionsProps {
  allowSend: boolean;
  onQuestionSubmitted: (question: string) => void;
}

const DefaultQuestions: React.FC<DefaultQuestionsProps> = ({
  allowSend,
  onQuestionSubmitted,
}) => {
  const questions = [
    'How many holidays are in march?',
    'What are the official staff holidays?',
    'What is the meal limit for a business lunch?',
    'Do I need approval to work from home?',
  ];
  return (
    <div className='input-group d-flex justify-content-center mt-auto'>
      {questions.map((question, index) => (
        <button
          key={index}
          className='form-control me-2'
          onClick={() => {
            onQuestionSubmitted(question);
          }}
          disabled={!allowSend}
        >
          {question}
        </button>
      ))}
    </div>
  );
};

export default DefaultQuestions;
