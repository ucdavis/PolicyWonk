'use client';
import { useEffect, useState } from 'react';

import { StreamableValue, readStreamableValue } from 'ai/rsc';

export const useStreamableText = (
  content: string | StreamableValue<string>,
  shouldAppend = true
) => {
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
