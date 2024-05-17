import { ChatHistory } from '@/models/chat';

export const getFullQuestionAndAnswer = (aiState: ChatHistory) => {
  if (!aiState?.messages) {
    // TODO: throw error
    return '';
  }

  const copyableText = aiState.messages
    .filter(
      (message) => message.role === 'user' || message.role === 'assistant'
    )
    .map((message) => {
      return message.role === 'user'
        ? `${message.content}`
        : `Policy Wonk:\n${message.content}`;
    })
    .join('\n\n');

  return copyableText;
};
