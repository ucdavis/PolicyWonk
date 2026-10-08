'use client';
import React from 'react';

import { faPaperPlane } from '@fortawesome/free-regular-svg-icons';
import { faPaperPlane as faPaperPlaneSolid } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { shareChat, unshareChat } from '../../../lib/actions';
import WonkyClientError from '../../../lib/error/wonkyClientError';
import WonkyErrorBoundary from '../../../lib/error/wonkyErrorBoundary';
import { useGtagEvent } from '../../../lib/hooks/useGtagEvent';
import type { ChatHistory } from '../../../models/chat';
import { GTagEvents } from '../../../models/gtag';

import { ShareButton } from './shareButtons';
import SharedUrl from './sharedUrl';

export type ShareModalLoadingStates =
  | ''
  | GTagEvents.SHARE
  | GTagEvents.REGEN_SHARE
  | GTagEvents.UNSHARE;

interface ShareModalProps {
  chat: ChatHistory;
  onShareIdUpdate: (shareId: ChatHistory['shareId']) => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ chat, onShareIdUpdate }) => {
  const gtagEvent = useGtagEvent();
  const { id: chatId, shareId, group } = chat;

  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<ShareModalLoadingStates>('');
  const isShared = !!shareId;

  const handleShare = async (
    type: GTagEvents.SHARE | GTagEvents.REGEN_SHARE
  ) => {
    setIsLoading(type);
    gtagEvent({
      event: type,
      chat,
    });
    try {
      const newShareId = await shareChat(chatId);
      onShareIdUpdate(newShareId);
    } finally {
      setIsLoading('');
    }
  };

  const handleUnshare = async () => {
    setIsLoading(GTagEvents.UNSHARE);
    gtagEvent({ event: GTagEvents.UNSHARE, chat });
    try {
      await unshareChat(chatId);
      onShareIdUpdate(undefined);
    } finally {
      setIsLoading('');
    }
  };

  const handleCopyShareUrl = () => {
    gtagEvent({ event: GTagEvents.COPY_SHARE, chat });
  };

  const openModal = () => {
    setIsOpen(true);
    gtagEvent({ event: GTagEvents.OPEN_SHARE_MODAL, chat });
  };

  const closeModal = () => setIsOpen(false);

  return (
    <>
      <button
        type='button'
        className={`btn btn-ghost btn-lg btn-square mr-1 bg-transparent text-base-content/60 shadow-none hover:bg-transparent hover:text-primary active:bg-transparent disabled:bg-transparent ${
          isShared ? 'text-primary' : ''
        }`}
        onClick={openModal}
        title='Share chat'
        aria-label='Share chat'
      >
        <FontAwesomeIcon icon={isShared ? faPaperPlaneSolid : faPaperPlane} />
      </button>
      {isOpen && (
        <dialog
          className='modal modal-open'
          aria-modal='true'
          aria-labelledby='share-chat-title'
        >
          <div className='modal-box max-w-2xl border border-main-border bg-base-100 p-0'>
            <div className='flex items-center justify-between border-b border-main-border bg-base-200 px-6 py-4'>
              <h2 id='share-chat-title' className='text-lg font-semibold'>
                Share chat
              </h2>
              <button
                type='button'
                className='btn btn-ghost btn-sm btn-circle'
                onClick={closeModal}
                aria-label='Close share dialog'
              >
                ✕
              </button>
            </div>
            <div className='space-y-4 p-6'>
              <p>
                Sharing this chat will allow anyone with the link to view it.
                They will be able to see your name and the entire content of the
                chat. You will be able to delete the shared link or regenerate
                it at any time.
              </p>
              <WonkyErrorBoundary
                fallback={
                  <WonkyClientError
                    thereWasAnErrorLoadingThe='shared url'
                    type='alert'
                  />
                }
              >
                <SharedUrl
                  shareId={shareId}
                  group={group}
                  isShared={isShared}
                  handleRegenShare={() => handleShare(GTagEvents.REGEN_SHARE)}
                  handleUnshare={handleUnshare}
                  handleCopyShareUrl={handleCopyShareUrl}
                  isLoading={isLoading}
                />
              </WonkyErrorBoundary>
            </div>
            <div className='flex justify-end gap-2 border-t border-main-border px-6 py-4'>
              {!isShared && (
                <ShareButton
                  handleShare={() => handleShare(GTagEvents.SHARE)}
                  loadingState={isLoading}
                />
              )}
              <button
                type='button'
                className='btn btn-ghost'
                onClick={closeModal}
              >
                {!isShared ? 'Cancel' : 'Close'}
              </button>
            </div>
          </div>
          <form method='dialog' className='modal-backdrop'>
            <button type='button' onClick={closeModal}>
              Close
            </button>
          </form>
        </dialog>
      )}
    </>
  );
};

export default ShareModal;
