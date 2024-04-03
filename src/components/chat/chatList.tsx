import { Message } from 'ai';
import Link from 'next/link';
import { Session } from 'next-auth';

import { UIState } from '@/lib/actions';

import { ChatMessage } from './chatMessage';

export interface ChatList {
  messages: UIState;
  session?: Session;
  // isShared: boolean;
}

export function ChatList({ messages, session }: ChatList) {
  if (!messages.length) {
    return null;
  }

  return (
    <div>
      {messages.map((message, index) => (
        <div key={message.id}>
          {message.display}
          {index < messages.length - 1 && <br />}
        </div>
      ))}
      {/* {messages // TODO: add suspense boundary and loading animation
        .filter((m: Message) => m.role === 'assistant' || m.role === 'user')
        .map((m: Message) => (
          <div className='row mb-3' key={m.id}>
            <div className='col-1'>
              <RolePortrait role={m.role} />
            </div>
            <div className='col-11'>
              <p className='chat-name'>
                <strong>{`${m.role}: `}</strong>
              </p>

              <ChatMessage message={m} />
            </div>
          </div>
        ))} */}
    </div>
  );
}
