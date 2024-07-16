'use client';

import { useEffect, useState } from 'react';

import { StreamableValue, readStreamableValue } from 'ai/rsc';

interface StreamableTextOptions {
  shouldAppend?: boolean;
}

export const useStreamableText = (
  content: string | StreamableValue<string>,
  options: StreamableTextOptions = {
    shouldAppend: true,
  }
) => {
  const streamedContent = useStreamingText(content, options);
  // if the content is a string, we are done streaming
  if (typeof content === 'string') {
    return content;
  }
  return streamedContent;
};

const useStreamingText = (
  content: string | StreamableValue<string>,
  options: StreamableTextOptions
) => {
  const { shouldAppend } = options;

  const [rawContent, setRawContent] = useState(
    typeof content === 'string' ? content : ''
  );

  useEffect(() => {
    (async () => {
      if (typeof content === 'object') {
        let value = '';
        for await (const delta of readStreamableValue(content)) {
          if (typeof delta === 'string') {
            setRawContent(shouldAppend ? (value = value + delta) : delta);
          }
        }
      } else if (typeof content === 'string') {
        setRawContent(content);
      }
    })();
  }, [content, shouldAppend]);

  return rawContent;
};
