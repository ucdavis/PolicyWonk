import { FC, memo } from 'react';

import dynamic from 'next/dynamic';
import { Options } from 'react-markdown';

const ReactMarkdown = dynamic(() => import('react-markdown'));

export const MemoizedReactMarkdown: FC<Options> = memo(
  ReactMarkdown,
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.className === nextProps.className
);
