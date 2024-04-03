import React from 'react';

import { nanoid } from 'ai';
import { useActions, useUIState } from 'ai/rsc';
import { useFormState, useFormStatus } from 'react-dom';

import { AI } from '@/lib/actions';

import { UserMessage } from './chatMessage';

interface ChatBoxProps {}

const ChatBox: React.FC<ChatBoxProps> = ({}) => {
  const [input, setInput] = React.useState('');
  const formRef = React.useRef<HTMLFormElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  // we aren't displaying messages, but we do need to set new ones
  const [_, setMessages] = useUIState<typeof AI>();
  // use a server action to submit
  const { submitUserMessage } = useActions();

  // focus on the input when the component mounts
  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <form
      className='d-flex flex-column mt-3'
      onSubmit={async (e: any) => {
        e.preventDefault();

        // Blur focus on mobile
        if (window.innerWidth < 600) {
          e.target['message']?.blur();
        }

        const value = input.trim();
        setInput('');
        if (!value) return;

        // Optimistically add user message UI
        setMessages((currentMessages) => [
          ...currentMessages,
          {
            id: nanoid(),
            display: <UserMessage>{value}</UserMessage>,
          },
        ]);

        // Submit and get response message
        const responseMessage = await submitUserMessage(value);
        setMessages((currentMessages) => [...currentMessages, responseMessage]);
      }}
    >
      <div className='input-group'>
        <button
          className='input-group-text btn btn-secondary'
          onClick={(e) => {
            e.preventDefault();
            // onNewMessage();
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
      <FormButton />
    </form>
  );
};

export default ChatBox;

const FormButton = () => {
  // to do useFormStatus() this has to be in a child component of the form
  // we might not need to do this? i know we could do useFormState inside the ChatBox component
  // but i am not sure how useAction and useFormState work together
  const { pending } = useFormStatus();
  return (
    <button
      className='btn btn-primary mt-3'
      disabled={pending}
      aria-label='Send message'
      aria-disabled={pending}
    >
      Send
    </button>
  );
};
