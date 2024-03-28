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
    <div className='input-group d-flex flex-wrap justify-content-center'>
      {questions.map((question, index) => (
        <button
          key={index}
          className='form-control me-2 mb-2 btn'
          style={{ flex: '0 0 48%' }} // i dont know the right way to flex and account for margin
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
