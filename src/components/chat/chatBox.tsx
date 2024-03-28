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
          className='input-group-text'
          onClick={(e) => {
            e.preventDefault();
            onNewMessage();
          }}
        >
          +
        </button>
        <div className='form-floating'>
          <textarea
            ref={inputRef}
            tabIndex={0}
            className='form-control'
            autoFocus
            placeholder='Message Policy Wonk'
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
          <label htmlFor='floatingTextarea'>Message Policy Wonk</label>
        </div>
      </div>
      <button className='btn btn-primary mt-3' disabled={!allowSend}>
        Send
      </button>
    </form>
  );
};

export default ChatBox;
