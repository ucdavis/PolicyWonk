import React from 'react';
import { useMutation } from '@tanstack/react-query';

const useChatResponse = () => {
  const [reponses, setResponses] = React.useState<string>('');
  const [data, setData] = React.useState<string>('');
  const [loading, setLoading] = React.useState<boolean>(false);

  const { mutate: startChatStreaming } = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      // TODO: other error handling?

      return response.body.getReader();
    },
    onSuccess: (reader) => {
      setLoading(true);
      const read = async () => {
        const { done, value } = await reader.read();
        if (done) {
          setLoading(false);
          return;
        }

        const text = new TextDecoder('utf-8').decode(value);

        // determine how to handle end stream, might have to return [DONE] from the server
        setResponses((prev) => prev + text);

        read(); // keep reading
      };

      read();
    },
  });

  return { reponses, data, loading, startChatStreaming };
};

const MainContent: React.FC = () => {
  const [message, setMessage] = React.useState<string>('');

  const { reponses, data, loading, startChatStreaming } = useChatResponse();

  const handleSendMessage = () => {
    startChatStreaming(message);
  };

  return (
    <main className='main-content text-center py-4 d-flex flex-column'>
      <h2 className='main-title'>Policy Wonk</h2>
      <h3 className='sub-title'>Your UC Policy Expert</h3>
      <p className='intro-text'>
        Meet Policywonk, your personal guide to navigating all the ins and outs
        of UC policies...
      </p>
      <div>Chat goes in here</div>

      <div className='input-group d-flex justify-content-center mt-auto'>
        <input
          type='text'
          disabled
          className='form-control me-2'
          placeholder='How many holidays are in march?'
        />
        <input
          type='text'
          disabled
          className='form-control'
          placeholder='How many holidays are in march?'
        />
      </div>
      <div className='form-floating'>
        <textarea
          className='form-control'
          placeholder='Message Policy Wonk'
          id='floatingTextarea'
        ></textarea>
        <label htmlFor='floatingTextarea'>Message Policy Wonk</label>
      </div>
      <button className='btn btn-primary mt-3' onClick={handleSendMessage}>
        Send
      </button>

      <p className='disclaimer-text'>
        Disclaimer: The information provided by Policywonk is for general
        informational purposes only and should not be considered legal or
        professional advice. Always consult with the appropriate experts and
        refer to official policies for accurate and up-to-date information.
      </p>
    </main>
  );
};

export default MainContent;
