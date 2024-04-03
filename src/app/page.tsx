import React from 'react';

import { nanoid } from 'nanoid';

import MainContent from '@/components/chat/main';
import { AI } from '@/lib/actions';

const HomePage: React.FC = () => {
  const chatId = React.useMemo(() => nanoid(), []);

  return (
    <AI initialAIState={{ chatId, messages: [] }}>
      <MainContent chatId={chatId} />
    </AI>
  );
};

export default HomePage;
