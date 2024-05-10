'use client';
import React from 'react';

interface ChatBoxFormProps {
  onQuestionSubmit: (question: string) => void;
}

const ChatBoxForm: React.FC<ChatBoxFormProps> = ({ onQuestionSubmit }) => {
  const [input, setInput] = React.useState('');
  const formRef = React.useRef<HTMLFormElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  // focus on the input when the component mounts
  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <form
      ref={formRef}
      className='d-flex flex-column mt-3'
      onSubmit={async (e: any) => {
        // can you pull this out? how does this work with server actions?
        e.preventDefault();

        const value = input.trim();
        setInput('');
        if (!value) {
          return;
        }

        onQuestionSubmit(value);
      }}
    >
      <div className='input-group'>
        <div className='form-floating'>
          <textarea
            id='messageTextArea'
            ref={inputRef}
            tabIndex={0}
            className='form-control wonk-input'
            autoFocus
            placeholder='Message Policy Wonk'
            value={input}
            onChange={(e) => setInput(e.target.value)}
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
          <label htmlFor='messageTextArea'>Message Policy Wonk</label>
        </div>
      </div>
      <button className='btn btn-primary mt-3' aria-label='Send message'>
        Send
      </button>{' '}
    </form>
  );
};

export default ChatBoxForm;
