import React from 'react';

import MainContent from '@/components/chat/main';

const HomePage: React.FC = () => {
  return (
    <div className='main-content d-flex flex-column'>
      <MainContent />
    </div>
  );
};

export default HomePage;
