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
    <div className='input-group d-flex flex-wrap justify-content-between'>
      {questions.map((question, index) => (
        <button
          key={index}
          className='form-control me-2 mb-2 btn btn-wonk text-start color-secondary-font'
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
