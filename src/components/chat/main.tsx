'use client';
import React from 'react';

import { useAIState, useUIState } from 'ai/rsc';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { AI } from '@/lib/aiProvider';
import ErrorBoundary from '@/lib/error/errorBoundary';
import WonkError from '@/lib/error/wonkError';

import Disclaimer from '../layout/disclaimer';
import WonkBottom from '../layout/wonkBottom';
import WonkTop from '../layout/wonkTop';

import ChatInput from './ask/chatInput';
import ChatHeader from './chatHeader';

const MainContent = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [aiState] = useAIState<typeof AI>();
  const [messagesUI, _] = useUIState<typeof AI>();

  React.useEffect(() => {
    if (
      // on first response from AI
      pathname === '/chat/new' &&
      aiState.id !== '' // id is set only once the chat has been saved to the db
    ) {
      // reloads the sidebar, which repulls from the db now that the chat has been saved
      router.refresh();
      window.history.pushState({}, '', `/chat/${aiState.id}`);
    }
  }, [aiState.messages, router, aiState.id, pathname]);

  const onNewMessage = () => {
    let newRoute = `/?focus=${aiState.focus.name}`;

    if (aiState.focus.subFocus) {
      newRoute += `&subFocus=${aiState.focus.subFocus}`;
    }

    router.push(newRoute);
  };

  return (
    <>
      {!messagesUI.length ? (
        <>
          <WonkTop>
            <ChatHeader>
              Meet PolicyWonk, a resource for navigating UC Davis administrative
              policies and procedures.
              <br />
              <Link className='btn btn-wonk mt-2' href='/about'>
                Learn more
              </Link>
            </ChatHeader>
          </WonkTop>
          <WonkBottom>
            <ErrorBoundary
              fallback={
                <WonkError thereWasAnErrorLoadingThe='input' type='alert' />
              }
            >
              <ChatInput />
            </ErrorBoundary>
            <Disclaimer />
          </WonkBottom>
        </>
      ) : (
        <>
          <WonkTop>
            {messagesUI // this is a list of actual React Nodes
              // as generated by our server action submitUserMessage in actions.tsx
              // the first UI node is added on submit in chatInput.tsx
              .map((m) => {
                return (
                  <div key={m.id}>
                    <ErrorBoundary
                      fallback={
                        <WonkError
                          type='alert'
                          thereWasAnErrorLoadingThe='message'
                        />
                      }
                    >
                      {m.display}
                    </ErrorBoundary>
                  </div>
                );
              })}
          </WonkTop>
          <WonkBottom>
            <div className='d-flex flex-column'>
              <button
                className='btn btn-primary mt-3 mb-3'
                onClick={() => {
                  onNewMessage();
                }}
                aria-label='Ask another question'
              >
                Ask another question
              </button>
            </div>
          </WonkBottom>
        </>
      )}
    </>
  );
};

export default MainContent;
