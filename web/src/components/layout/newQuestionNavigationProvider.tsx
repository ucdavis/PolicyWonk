'use client';

import React from 'react';

type NavigateToNewQuestion = () => void;
type NewQuestionRequestHandler = (navigate: NavigateToNewQuestion) => void;

interface NewQuestionNavigationContextProps {
  registerNewQuestionRequestHandler: (
    handler: NewQuestionRequestHandler
  ) => () => void;
  requestNewQuestion: (navigate: NavigateToNewQuestion) => boolean;
}

const NewQuestionNavigationContext =
  React.createContext<NewQuestionNavigationContextProps>({
    registerNewQuestionRequestHandler: () => () => {},
    requestNewQuestion: () => false,
  });

export const NewQuestionNavigationProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const handlerRef = React.useRef<NewQuestionRequestHandler | null>(null);

  const registerNewQuestionRequestHandler = React.useCallback(
    (handler: NewQuestionRequestHandler) => {
      handlerRef.current = handler;

      return () => {
        if (handlerRef.current === handler) {
          handlerRef.current = null;
        }
      };
    },
    []
  );

  const requestNewQuestion = React.useCallback(
    (navigate: NavigateToNewQuestion) => {
      const handler = handlerRef.current;

      if (!handler) {
        return false;
      }

      handler(navigate);
      return true;
    },
    []
  );

  return (
    <NewQuestionNavigationContext.Provider
      value={{ registerNewQuestionRequestHandler, requestNewQuestion }}
    >
      {children}
    </NewQuestionNavigationContext.Provider>
  );
};

export const useNewQuestionNavigation = () =>
  React.useContext(NewQuestionNavigationContext);
