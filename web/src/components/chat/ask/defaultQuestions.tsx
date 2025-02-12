'use client';
import React from 'react';

import { useAIState } from 'ai/rsc';

import { Focus } from '../../../models/focus';

interface DefaultQuestionsProps {
  onQuestionSubmit: (question: string) => void;
}

const DefaultQuestions: React.FC<DefaultQuestionsProps> = ({
  onQuestionSubmit,
}) => {
  const [aiState] = useAIState();

  const questions = getDefaultQuestions(aiState.focus);
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

const getDefaultQuestions = (focus: Focus) => {
  if (focus.name === 'core') {
    return [
      'Do I need approval to work from home?',
      'What is extended leave?',
      'What are the official campus holidays?',
      'When must security updates be installed?',
    ];
  } else if (focus.name === 'apm') {
    return [
      'What is a “non-faculty academic appointee”?',
      'What does the Privilege and Tenure committee do?',
      'Who can appoint an advisor to address a grievance?',
      'Who can get an Academic Coordinator title?',
    ];
  } else if (focus.name === 'unions') {
    return [
      'Describe the scheduling considerations for this union',
      'How is this union recognized?',
      'Tell me about compensation',
      'What is the sick leave policy?',
    ];
  } else if (focus.name === 'knowledgebase') {
    return [
      'How do I schedule a Zoom meeting?',
      'Tips on keeping my laptop safe',
      'How do I backup my data?',
      'How do I setup email forwarding?',
    ];
  } else {
    return [];
  }
};

export default DefaultQuestions;
