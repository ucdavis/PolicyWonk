'use client';
import React from 'react';

import { useAIState, useUIState } from 'ai/rsc';
import { usePathname, useRouter } from 'next/navigation';

import { AI } from '@/lib/actions';

import Disclaimer from '../layout/disclaimer';
import WonkBottom from '../layout/wonkBottom';
import WonkTop from '../layout/wonkTop';

import ChatHeader from './chatHeader';
import ChatInput from './chatInput';
import FocusBanner from './focusBanner';

const MainContent = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [aiState] = useAIState<typeof AI>();
  const [messagesUI, _] = useUIState<typeof AI>();

  React.useEffect(() => {
    if (
      // on first response from AI
      pathname === '/chat/new' &&
      aiState.messages.filter((m) => m.role === 'assistant').length === 1
    ) {
      // TODO: i'd like to refresh when the user submits a message, not once the answer is done

      // reloads the sidebar, which repulls from the db now that the chat has been saved
      router.refresh();
      window.history.pushState({}, '', `/chat/${aiState.id}`);
    }
  }, [aiState.messages, router, aiState.id, pathname]);

  const onNewMessage = () => {
    router.push('/');
  };

  return (
    <>
      {!messagesUI.length ? (
        <>
          <WonkTop>
            <ChatHeader />
          </WonkTop>
          <WonkBottom>
            <ChatInput />
            <Disclaimer />
          </WonkBottom>
        </>
      ) : (
        <>
          <WonkTop>
            <FocusBanner focus={aiState.focus} />
            {messagesUI // this is a list of actual React Nodes
              // as generated by our server action submitUserMessage in actions.tsx
              // or by getUIStateFromAIState in page.tsx
              .map((m) => {
                return <div key={m.id}>{m.display}</div>;
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
