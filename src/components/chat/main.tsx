'use client';

import { useChat, Message } from 'ai/react';
import React from 'react';

const MainContent: React.FC = () => {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/chat',
  });

  return (
    <main className='main-content d-flex flex-column'>
      <img
        className='img-fluid policy-png'
        src='/media/policy-wonk.png'
        alt='Aggie Gold Robot cartoon'
      />
      <h2 className='main-title'>Policy Wonk</h2>
      <h3 className='sub-title'>Your UC Policy Expert</h3>
      <p className='intro-text'>
        Meet Policywonk, your personal guide to navigating all the ins and outs
        of UC policies...
      </p>
      {messages.map((m: Message) => (
        <div key={m.id} style={{ whiteSpace: 'pre-wrap' }}>
          <strong>{`${m.role}: `}</strong>
          {m.role !== 'data' && m.content}
          {m.role === 'data' && (
            <>
              {(m.data as any).description}
              <br />
              <pre className={'bg-gray-200'}>
                {JSON.stringify(m.data, null, 2)}
              </pre>
            </>
          )}
          <br />
          <br />
        </div>
      ))}

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

      <form className='d-flex flex-column mt-3' onSubmit={handleSubmit}>
        <div className='form-floating'>
          <textarea
            className='form-control'
            autoFocus
            placeholder='Message Policy Wonk'
            value={input}
            onChange={handleInputChange}
            id='floatingTextarea'
          ></textarea>
          <label htmlFor='floatingTextarea'>Message Policy Wonk</label>
        </div>
        <button className='btn btn-primary mt-3'>Send</button>
      </form>

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
