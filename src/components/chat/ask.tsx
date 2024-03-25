'use client';
import React from 'react';

interface AskProps {
  allowSend: boolean;
  onQuestionSubmitted: (question: string) => void;
}

const Ask: React.FC<AskProps> = (props: AskProps) => {
  const [message, setMessage] = React.useState('');
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  // focus on the input when the component mounts
  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (!message) {
      return;
    }

    setMessage('');

    props.onQuestionSubmitted(message);
  }

  return (
    <form className='d-flex flex-column mt-3' onSubmit={handleSubmit}>
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
        ></textarea>
        <label htmlFor='floatingTextarea'>Message Policy Wonk</label>
      </div>
      <button className='btn btn-primary mt-3' disabled={!props.allowSend}>
        Send
      </button>
    </form>
  );
};

export default Ask;
