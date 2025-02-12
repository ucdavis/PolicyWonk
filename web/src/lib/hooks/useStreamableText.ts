'use client';

import { useEffect, useState } from 'react';

import { StreamableValue, readStreamableValue } from 'ai/rsc';

interface StreamableTextOptions {
  shouldAppend?: boolean;
}

/**
 * This hook reads a streamable value and returns its final updated value.
 *
 * @param content Either a StreamableValue, or a string once the stream has completed
 * @param options \{ shouldAppend: true }, controls whether any updates to the stream append to or replace previous content
 * @returns if the stream is complete and content is a string, it returns the content. otherwise, it returns the most recent value of the stream
 */
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

/**
 * This hook reads a stream and ultimately returns the final value on the **stream object**.
 *
 * The state, `rawContent`, will not accurately reflect any changes made after `textStream.done()`.
 * **If `content` is a string, it will only be used to initialize the value.**
 * There is no way to selectively append, e.g. you cannot have the stream append up until `textStream.done(finalContent)`,
 * and then have the finalContent override the previously appended content (like we want to do when updating citations).
 * This is because the IIFE updates the state outside of the react lifecycle, and `readStreamableValue` only returns text, so we cannot
 * see if it is the final chunk, or if there is a `next`
 */
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
      }
    })();
  }, [content, shouldAppend]);

  return rawContent;
};
