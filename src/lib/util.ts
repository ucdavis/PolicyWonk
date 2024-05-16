import { ChatHistory } from '@/models/chat';

export const getFullQuestionAndAnswer = (aiState: ChatHistory) => {
  const copyableText = aiState.messages
    .filter(
      (message) => message.role === 'user' || message.role === 'assistant'
    )
    .map((message) => {
      return message.role === 'user'
        ? `${aiState.user ?? 'You'}:\n${message.content}`
        : `Policy Wonk:\n${message.content}`;
    })
    .join('\n\n');

  return copyableText;
};
