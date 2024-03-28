import React from 'react';

import MainContent from '@/components/chat/main';

const HomePage: React.FC = () => {
  return (
    <div className='main-content d-flex flex-column'>
      <MainContent />
      <p className='disclaimer-text small mt-2'>
        Disclaimer: The information provided by Policywonk is for general
        informational purposes only and should not be considered legal or
        professional advice. Always consult with the appropriate experts and
        refer to official policies for accurate and up-to-date information.
      </p>
    </div>
  );
};

export default HomePage;
