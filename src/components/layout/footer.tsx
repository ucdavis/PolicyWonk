import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer>
      <p>links</p>
      <a target='_blank' rel='noopener noreferrer' href='https://ucdavis.edu'>
        <img src='/media/ucdavis-grey.svg' alt='UC Davis logo greyscale' />
      </a>
      <p>
        copyright 2024 code here
        <br />
        <span className='version-notice'>Policywonk v1.2.3.311</span>
      </p>
    </footer>
  );
};

export default Footer;
