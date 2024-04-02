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
    <div className='d-grid d-md-block'>
      {questions.map((question, index) => (
        <button
          key={index}
          className='btn btn-wonk text-start color-secondary-font'
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
