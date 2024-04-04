import React from 'react';

import { Message } from 'ai';

import { ChatMessage } from './chatMessage';
import { WonkPortrait } from './rolePortrait';
import { UserPortrait } from './userPortrait';

interface ChatMessageContainerProps {
  message: Message;
  isLoading: boolean;
}

export const ChatMessageContainer = ({
  message,
  isLoading,
}: ChatMessageContainerProps) => {
  const roleDisplayName = message.role === 'user' ? 'You' : 'Policy Wonk';
  return (
    <div className='row mb-3' key={message.id}>
      <div className='col-3 col-md-1 mb-2'>
        {message.role === 'user' ? (
          <UserPortrait />
        ) : (
          <WonkPortrait
            roleDisplayName={roleDisplayName}
            isLoading={isLoading}
          />
        )}
      </div>
      <div className='col-10 col-md-11'>
        <p className='chat-name'>
          <strong>{`${roleDisplayName}: `}</strong>
        </p>
        <ChatMessage message={message} />
      </div>
    </div>
  );
};