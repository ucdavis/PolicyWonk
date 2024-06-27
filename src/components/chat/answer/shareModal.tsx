'use client';
import React from 'react';

import { faPaperPlane } from '@fortawesome/free-regular-svg-icons';
import { faPaperPlane as faPaperPlaneSolid } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useActions, useAIState } from 'ai/rsc';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';

import AnimatedButton from '@/components/ui/animatedButton';
import { AI } from '@/lib/aiProvider';
import WonkyError from '@/lib/error/wonkyError';
import WonkyErrorBoundary from '@/lib/error/wonkyErrorBoundary';
import { useGtagEvent } from '@/lib/hooks/useGtagEvent';
import { GTagEvents } from '@/models/gtag';

import { ShareButton } from './shareButtons';
import SharedUrl from './sharedUrl';

export type ShareModalLoadingStates =
  | ''
  | GTagEvents.SHARE
  | GTagEvents.REGEN_SHARE
  | GTagEvents.UNSHARE;

const ShareModal: React.FC = () => {
  const gtagEvent = useGtagEvent();
  const { shareChat, unshareChat } = useActions<typeof AI>();
  const [aiState] = useAIState<typeof AI>();
  const { id: chatId, shareId } = aiState;

  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<ShareModalLoadingStates>('');
  const isShared = shareId !== undefined;

  const handleShare = async (
    type: GTagEvents.SHARE | GTagEvents.REGEN_SHARE
  ) => {
    setIsLoading(type);
    gtagEvent({
      event: type,
      chat: aiState,
    });
    await shareChat(chatId);
    setIsLoading('');
  };

  const handleUnshare = async () => {
    setIsLoading(GTagEvents.UNSHARE);
    gtagEvent({ event: GTagEvents.UNSHARE, chat: aiState });
    await unshareChat(chatId);
    setIsLoading('');
  };

  const handleCopyShareUrl = () => {
    gtagEvent({ event: GTagEvents.COPY_SHARE, chat: aiState });
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
          gtagEvent({ event: GTagEvents.OPEN_SHARE_MODAL, chat: aiState });
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
              <WonkyError thereWasAnErrorLoadingThe='shared url' type='alert' />
            }
          >
            <SharedUrl
              shareId={shareId}
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
          <Button color='secondary' onClick={toggle}>
            {!isShared ? 'Cancel' : 'Close'}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default ShareModal;
