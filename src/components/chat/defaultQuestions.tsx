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
