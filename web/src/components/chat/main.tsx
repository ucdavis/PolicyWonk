'use client';
import React from 'react';

import { useChat } from '@ai-sdk/react';
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DefaultChatTransport, type UIMessage } from 'ai';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';

import { campusMap } from '@/lib/constants';

import WonkyClientError from '../../lib/error/wonkyClientError';
import WonkyErrorBoundary from '../../lib/error/wonkyErrorBoundary';
import { useGtagEvent } from '../../lib/hooks/useGtagEvent';
import type { ChatHistory } from '../../models/chat';
import type { Focus } from '../../models/focus';
import { GTagEvents } from '../../models/gtag';

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

const createBlankChatState = (chat: ChatHistory): ChatHistory => ({
  id: '',
  active: true,
  title: '',
  messages: [],
  assistantSlug: 'policywonk',
  meta: { focus: chat.meta.focus },
  group: chat.group,
  llmModel: chat.llmModel,
  userId: chat.userId,
  reaction: undefined,
  timestamp: new Date(),
  shareId: undefined,
});

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

  const { messages, sendMessage, setMessages, status, error, clearError } =
    useChat({
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
  const isAnswerInProgress = status === 'submitted' || status === 'streaming';

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

  const navigateToNewQuestion = React.useCallback(() => {
    let newRoute = `/${chat.group}/chat/new?focus=${chat.meta.focus.name}`;

    if (chat.meta.focus.subFocus) {
      newRoute += `&subFocus=${chat.meta.focus.subFocus}`;
    }

    setMessages([]);
    setChat(createBlankChatState);
    setCurrentStatusMessage('');
    clearError();
    didLogNewChatEventRef.current = false;
    lastRedirectedChatIdRef.current = null;
    router.push(newRoute);
  }, [
    chat.group,
    chat.meta.focus.name,
    chat.meta.focus.subFocus,
    clearError,
    router,
    setMessages,
  ]);

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

  const campus = campusMap[chat.group];
  const campusLogo = campus ? (
    <div className='mx-auto -mt-4 mb-6 flex w-full max-w-7xl justify-end lg:mt-0'>
      <a
        href={campus.link}
        target='_blank'
        rel='noopener noreferrer'
        aria-label={campus.name}
      >
        <Image
          src={campus.logoPath}
          alt=''
          aria-hidden='true'
          width={120}
          height={54}
          className='h-auto w-28 md:w-32'
        />
      </a>
    </div>
  ) : null;

  return (
    <>
      {!!error && (
        <div className='mx-auto w-full max-w-3xl'>
          <WonkyClientError thereWasAnErrorLoadingThe='chat' type='alert' />
        </div>
      )}
      <div
        className={`min-h-0 flex-1 overflow-y-auto ${
          !messages.length ? 'flex flex-col py-8' : 'pt-8 lg:pt-4'
        }`}
      >
        {campusLogo}
        {!messages.length ? (
          <div className='mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-2 pb-8'>
            <ChatHeader className='py-0' />
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
          </div>
        ) : (
          <div className='mx-auto w-full max-w-3xl'>
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
                <p className='mb-0 text-base-content/65'>
                  {currentStatusMessage || 'PolicyWonk is thinking…'}
                </p>
              )}
            {!isAnswerInProgress && (
              <div className='mt-4 pb-4'>
                <button
                  type='button'
                  className='btn btn-primary w-full sm:w-auto'
                  onClick={navigateToNewQuestion}
                  aria-label='Start a new question'
                >
                  New question{' '}
                  <FontAwesomeIcon className='ml-1' icon={faPenToSquare} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default MainContent;
