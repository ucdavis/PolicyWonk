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
        className='wonk-input-wrapper'
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
        <div className='form-floating w-full'>
          <textarea
            id='messageTextArea'
            ref={inputRef}
            tabIndex={0}
            className='form-control wonk-input resize-none overflow-hidden'
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
          <label htmlFor='messageTextArea'>Ask a question</label>
        </div>
        <button className='btn btn-prompt' aria-label='Send message'>
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </form>
      <p className='disclaimer text-end mt-3 mb-2'>
        PolicyWonk can make errors, view our{' '}
        <Link
          className='discreet-link'
          href='https://iet.ucdavis.edu/aggie-ai/rocky/faq'
        >
          Disclaimer.
        </Link>
      </p>
    </>
  );
};

export default ChatBoxForm;
