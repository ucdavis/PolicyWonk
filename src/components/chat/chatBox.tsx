'use client';
import React from 'react';

interface ChatBoxProps {
  allowSend: boolean;
  onQuestionSubmitted: (question: string) => void;
  onNewMessage: () => void;
}

const ChatBox: React.FC<ChatBoxProps> = ({
  allowSend,
  onQuestionSubmitted,
  onNewMessage,
}) => {
  const [message, setMessage] = React.useState('');
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  // focus on the input when the component mounts
  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  function handleSubmit(
    event:
      | React.FormEvent<HTMLFormElement>
      | React.KeyboardEvent<HTMLTextAreaElement>
  ): void {
    event.preventDefault();

    if (!message) {
      return;
    }

    setMessage('');

    onQuestionSubmitted(message);
  }

  return (
    <form className='d-flex flex-column mt-3' onSubmit={handleSubmit}>
      <div className='input-group'>
        <button
          className='input-group-text btn btn-secondary'
          onClick={(e) => {
            e.preventDefault();
            onNewMessage();
          }}
          aria-label='Start a new conversation'
        >
          +
        </button>
        <div className='form-floating'>
          <textarea
            id='messageTextArea'
            ref={inputRef}
            tabIndex={0}
            className='form-control'
            autoFocus
            placeholder='Ask your policy question'
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            spellCheck={false}
            autoComplete='off'
            autoCorrect='off'
            name='message'
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && allowSend) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          ></textarea>
          <label htmlFor='messageTextArea'>Ask your policy question</label>
        </div>
      </div>
      <button
        className='btn btn-primary mt-3'
        disabled={!allowSend}
        aria-label='Send message'
        aria-disabled={!allowSend}
      >
        Send
      </button>
    </form>
  );
};

export default ChatBox;
