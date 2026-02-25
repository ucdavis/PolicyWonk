'use client';
import React from 'react';

import { faPaperPlane } from '@fortawesome/free-regular-svg-icons';
import { faPaperPlane as faPaperPlaneSolid } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';

import { shareChat, unshareChat } from '../../../lib/actions';
import WonkyClientError from '../../../lib/error/wonkyClientError';
import WonkyErrorBoundary from '../../../lib/error/wonkyErrorBoundary';
import { useGtagEvent } from '../../../lib/hooks/useGtagEvent';
import type { ChatHistory } from '../../../models/chat';
import { GTagEvents } from '../../../models/gtag';
import AnimatedButton from '../../ui/animatedButton';

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

  const toggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <AnimatedButton
        displayBeforeClick={
          <FontAwesomeIcon icon={isShared ? faPaperPlaneSolid : faPaperPlane} />
        }
        onClick={toggle}
        selected={isShared}
        title={'Share Chat'}
      />
      <Modal
        isOpen={isOpen}
        toggle={toggle}
        onOpened={() => {
          gtagEvent({ event: GTagEvents.OPEN_SHARE_MODAL, chat });
        }}
      >
        <ModalHeader toggle={toggle}>Share Chat</ModalHeader>
        <ModalBody>
          <p>
            Sharing this chat will allow anyone with the link to view it. They
            will be able to see your name and the entire content of the chat.
            You will be able to delete the shared link or regenerate it at any
            time.
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
        </ModalBody>
        <ModalFooter>
          {!isShared && (
            <ShareButton
              handleShare={() => handleShare(GTagEvents.SHARE)}
              loadingState={isLoading}
            />
          )}
          <Button color='link' onClick={toggle}>
            {!isShared ? 'Cancel' : 'Close'}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default ShareModal;
