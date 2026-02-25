'use client';
import React from 'react';

import { useChat } from '@ai-sdk/react';
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { usePathname, useRouter } from 'next/navigation';

import WonkyClientError from '../../lib/error/wonkyClientError';
import WonkyErrorBoundary from '../../lib/error/wonkyErrorBoundary';
import { useGtagEvent } from '../../lib/hooks/useGtagEvent';
import type { ChatHistory } from '../../models/chat';
import type { Focus } from '../../models/focus';
import { GTagEvents } from '../../models/gtag';
import WonkBottom from '../layout/wonkBottom';
import WonkTop from '../layout/wonkTop';

import ChatActions from './answer/chatActions';
import FocusBanner from './answer/focusBanner';
import { WonkMessage } from './answer/wonkMessage';
import ChatInput from './ask/chatInput';
import ChatHeader from './chatHeader';
import { UserMessage } from './userMessage';

type MainContentProps = {
  initialChat: ChatHistory;
};

const getTextFromMessage = (message: UIMessage): string => {
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('');
};

const chatMessagesToUIMessages = (messages: ChatHistory['messages']) => {
  const uiMessages: UIMessage[] = [];

  for (const message of messages ?? []) {
    if (message.role === 'system') {
      continue;
    }

    uiMessages.push({
      id: message.id,
      role: message.role,
      parts: [{ type: 'text', text: message.content }],
    });
  }

  return uiMessages;
};

const MainContent: React.FC<MainContentProps> = ({ initialChat }) => {
  const router = useRouter();
  const pathname = usePathname();
  const gtagEvent = useGtagEvent();
  const [chat, setChat] = React.useState<ChatHistory>(initialChat);
  const [currentStatusMessage, setCurrentStatusMessage] =
    React.useState<string>('');
  const lastRedirectedChatIdRef = React.useRef<string | null>(null);
  const didLogNewChatEventRef = React.useRef<boolean>(false);

  const initialMessages = React.useMemo(
    () => chatMessagesToUIMessages(initialChat.messages),
    [initialChat.messages]
  );

  const transport = React.useMemo(
    () => new DefaultChatTransport({ api: '/api/chat' }),
    []
  );

  const { messages, sendMessage, status, error } = useChat({
    transport,
    messages: initialMessages,
    onData: (dataPart) => {
      if (dataPart.type !== 'data-aggiethought') {
        return;
      }

      const thought = dataPart.data;
      if (typeof thought === 'string') {
        setCurrentStatusMessage(thought);
      }
    },
  });

  const chatIdFromMetadata = React.useMemo(() => {
    const lastAssistantMessage = [...messages]
      .reverse()
      .find((message) => message.role === 'assistant');

    if (
      !lastAssistantMessage?.metadata ||
      typeof lastAssistantMessage.metadata !== 'object'
    ) {
      return null;
    }

    const chatId = (lastAssistantMessage.metadata as any).chatId;
    return typeof chatId === 'string' ? chatId : null;
  }, [messages]);

  React.useEffect(() => {
    if (status === 'ready') {
      setCurrentStatusMessage('');
    }
  }, [status]);

  React.useEffect(() => {
    if (
      // on first response from AI
      pathname === `/${chat.group}/chat/new` &&
      status === 'ready' &&
      chatIdFromMetadata && // id is only sent once the chat has been saved to the db
      lastRedirectedChatIdRef.current !== chatIdFromMetadata
    ) {
      lastRedirectedChatIdRef.current = chatIdFromMetadata;
      router.replace(`/${chat.group}/chat/${chatIdFromMetadata}`);
    }

    if (!chat.id && chatIdFromMetadata) {
      setChat((current) => ({
        ...current,
        id: chatIdFromMetadata,
      }));
    }
  }, [router, pathname, chat.group, chat.id, chatIdFromMetadata, status]);

  const onNewMessage = () => {
    let newRoute = `/?focus=${chat.meta.focus.name}`;

    if (chat.meta.focus.subFocus) {
      newRoute += `&subFocus=${chat.meta.focus.subFocus}`;
    }

    router.push(newRoute);
  };

  const onFocusSelection = (focus: Focus) => {
    setChat((currentChat) => ({
      ...currentChat,
      meta: { ...currentChat.meta, focus },
    }));
  };

  const onQuestionSubmit = async (question: string) => {
    if (
      !didLogNewChatEventRef.current &&
      pathname === `/${chat.group}/chat/new`
    ) {
      didLogNewChatEventRef.current = true;
      gtagEvent({ event: GTagEvents.NEW_CHAT, chat });
    }

    setCurrentStatusMessage('Starting...');
    await sendMessage(
      { text: question },
      {
        body: {
          group: chat.group,
          focus: chat.meta.focus.name,
          subFocus: chat.meta.focus.subFocus,
        },
      }
    );
  };

  const onFeedbackUpdate = (reaction: ChatHistory['reaction']) => {
    setChat((currentChat) => ({ ...currentChat, reaction }));
  };

  const onShareIdUpdate = (shareId: ChatHistory['shareId']) => {
    setChat((currentChat) => ({ ...currentChat, shareId }));
  };

  return (
    <>
      {!!error && (
        <div className='wonk-chat-width'>
          <WonkyClientError thereWasAnErrorLoadingThe='chat' type='alert' />
        </div>
      )}
      {!messages.length ? (
        <>
          <WonkTop>
            <ChatHeader>
              <></>
              {/* Empty children here */}
            </ChatHeader>
          </WonkTop>
          <WonkBottom>
            <WonkyErrorBoundary
              fallback={
                <WonkyClientError
                  thereWasAnErrorLoadingThe='input'
                  type='alert'
                />
              }
            >
              <ChatInput
                group={chat.group}
                focus={chat.meta.focus}
                onFocusSelection={onFocusSelection}
                onQuestionSubmit={onQuestionSubmit}
              />
            </WonkyErrorBoundary>
            {/* <Disclaimer /> */}
          </WonkBottom>
        </>
      ) : (
        <>
          <WonkTop>
            <FocusBanner focus={chat.meta.focus} />
            {messages.map((message, index) => {
              const text = getTextFromMessage(message);
              const isLastMessage = index === messages.length - 1;
              const isLoadingAnswer =
                isLastMessage &&
                message.role === 'assistant' &&
                status !== 'ready';

              return (
                <div key={message.id}>
                  <WonkyErrorBoundary
                    fallback={
                      <WonkyClientError
                        type='alert'
                        thereWasAnErrorLoadingThe='message'
                      />
                    }
                  >
                    {message.role === 'user' ? (
                      <UserMessage content={text} />
                    ) : (
                      <WonkMessage
                        content={text}
                        isLoading={isLoadingAnswer}
                        thought={isLoadingAnswer ? currentStatusMessage : null}
                      >
                        {chat.id && status === 'ready' && (
                          <ChatActions
                            chat={chat}
                            onReactionUpdate={onFeedbackUpdate}
                            onShareIdUpdate={onShareIdUpdate}
                          />
                        )}
                      </WonkMessage>
                    )}
                  </WonkyErrorBoundary>
                </div>
              );
            })}
            {status !== 'ready' &&
              messages[messages.length - 1]?.role !== 'assistant' && (
                <div className='wonk-chat-width'>
                  <p className='text-muted mb-0'>
                    {currentStatusMessage || 'PolicyWonk is thinking…'}
                  </p>
                </div>
              )}
          </WonkTop>
          <WonkBottom>
            <div className='wonk-chat-width mt-auto'>
              <div className='pt-4'>
                <button
                  className='btn btn-primary'
                  onClick={() => {
                    onNewMessage();
                  }}
                  aria-label='Ask another question'
                >
                  Ask another question{' '}
                  <FontAwesomeIcon className='ms-1' icon={faPenToSquare} />
                </button>
              </div>
            </div>
          </WonkBottom>
        </>
      )}
    </>
  );
};

export default MainContent;
