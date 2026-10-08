'use client';
import React from 'react';

import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';

interface ChatBoxFormProps {
  onQuestionSubmit: (question: string) => void;
}

const ChatBoxForm: React.FC<ChatBoxFormProps> = ({ onQuestionSubmit }) => {
  const [input, setInput] = React.useState('');
  const formRef = React.useRef<HTMLFormElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  // Focus on mount
  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Adjust textarea height
  const adjustHeight = () => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  React.useLayoutEffect(adjustHeight, [input]); // fires on every state update incl. clear

  return (
    <>
      <form
        ref={formRef}
        className='relative flex items-end'
        onSubmit={async (e) => {
          e.preventDefault();

          const value = input.trim();
          setInput('');
          if (!value) {
            return;
          }

          onQuestionSubmit(value);
        }}
      >
        <div className='w-full'>
          <textarea
            id='messageTextArea'
            ref={inputRef}
            tabIndex={0}
            className='textarea w-full resize-none overflow-hidden border-main-border bg-base-100 pr-14 pt-6 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'
            autoFocus
            placeholder='Ask PolicyWonk a question; Change your focus by clicking on the Focus Bar above'
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              adjustHeight();
            }}
            spellCheck={false}
            autoComplete='off'
            autoCorrect='off'
            name='message'
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                formRef.current?.requestSubmit();
              }
            }}
          ></textarea>
          <label
            htmlFor='messageTextArea'
            className='pointer-events-none absolute top-2 left-3 text-sm text-base-content/65'
          >
            Ask a question
          </label>
        </div>
        <button
          className='btn btn-primary btn-circle btn-sm absolute right-3 bottom-3'
          aria-label='Send message'
        >
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </form>
      <p className='mt-3 mb-2 text-right text-sm text-base-content/65'>
        PolicyWonk can make errors, view our{' '}
        <Link
          className='underline underline-offset-2 hover:text-primary'
          href='https://iet.ucdavis.edu/aggie-ai/rocky/faq'
        >
          Disclaimer.
        </Link>
      </p>
    </>
  );
};

export default ChatBoxForm;
