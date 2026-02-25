'use client';

import type { FC } from 'react';

import { Focus } from '../../../models/focus';

import ChatBoxForm from './chatBoxForm';
import FocusBar from './focusBar';

// Container for all of components that can be used to send messages to the chat
// Will send the actual message to the chatAI system
interface ChatInputProps {
  group: string;
  focus: Focus;
  onFocusSelection: (focus: Focus) => void;
  onQuestionSubmit: (question: string) => void | Promise<void>;
}

const ChatInput: FC<ChatInputProps> = ({
  group,
  focus,
  onFocusSelection,
  onQuestionSubmit,
}: ChatInputProps) => {
  return (
    <div className='wonk-chat-width'>
      <FocusBar
        group={group}
        focus={focus}
        onSelection={onFocusSelection}
      />
      <ChatBoxForm onQuestionSubmit={onQuestionSubmit} />
    </div>
  );
};

export default ChatInput;
