import openai from 'openai';
import React from 'react';

interface AskProps {
  onQuestionSubmitted: (question: string) => void;
}

const Ask: React.FC<AskProps> = (props: AskProps) => {
  const [message, setMessage] = React.useState('');

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (!message) {
      return;
    }

    props.onQuestionSubmitted(message);
  }

  return (
    <form className='d-flex flex-column mt-3' onSubmit={handleSubmit}>
      <div className='form-floating'>
        <textarea
          className='form-control'
          autoFocus
          placeholder='Message Policy Wonk'
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          id='floatingTextarea'
        ></textarea>
        <label htmlFor='floatingTextarea'>Message Policy Wonk</label>
      </div>
      <button className='btn btn-primary mt-3'>Send</button>
    </form>
  );
};

export default Ask;
