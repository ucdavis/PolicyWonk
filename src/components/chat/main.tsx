import React from 'react';

const MainContent: React.FC = () => {
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
          placeholder='Leave a comment here'
          id='floatingTextarea'
        ></textarea>
        <label htmlFor='floatingTextarea'>Comments</label>
      </div>

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
