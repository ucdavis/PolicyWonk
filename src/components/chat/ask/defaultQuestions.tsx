'use client';
import React from 'react';

interface DefaultQuestionsProps {
  onQuestionSubmit: (question: string) => void;
}

const DefaultQuestions: React.FC<DefaultQuestionsProps> = ({
  onQuestionSubmit,
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
          id={`gtag-default-question-${question}`}
          key={index}
          className='btn btn-wonk text-start color-secondary-font'
          onClick={() => onQuestionSubmit(question)}
        >
          {question}
        </button>
      ))}
    </div>
  );
};

export default DefaultQuestions;
