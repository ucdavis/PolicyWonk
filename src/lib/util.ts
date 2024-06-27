import { Message } from 'ai';

export const getFullQuestionAndAnswer = (messages: Message[]) => {
  if (!messages) {
    // TODO: throw error
    return '';
  }

  const copyableText = messages
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

export const sanitizeUserInput = (input: string) => {
  const sanitizedText = input.replace(/<[^>]*>?/gm, '');

  return sanitizedText;
};

export const cleanMetadataTitle = (title: string) => {
  const sanitizedTitle = sanitizeUserInput(title);
  return sanitizedTitle.length > 60
    ? `${sanitizedTitle.slice(0, 60)}...`
    : sanitizedTitle;
};

export const stripTemporaryCitations = (content: string) => {
  // temporary citations are of the form <c:1234>
  // we want to strip these out so they aren't shown
  return content.replace(/<c:\d+>/g, '');
};

// fix up common markdown issues
export const sanitizeMarkdown = (content: string) => {
  content = stripTemporaryCitations(content);

  return content;
};
