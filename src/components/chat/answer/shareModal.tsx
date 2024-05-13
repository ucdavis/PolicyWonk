'use client';
import React from 'react';

import { faPaperPlane } from '@fortawesome/free-regular-svg-icons';
import { faPaperPlane as faPaperPlaneSolid } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useActions, useAIState } from 'ai/rsc';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';

import AnimatedButton from '@/components/ui/animatedButton';
import { AI } from '@/lib/actions';

import { ShareButton } from './shareButtons';
import SharedUrl from './sharedUrl';

export type ShareModalLoadingStates = '' | 'share' | 'regen' | 'unshare';

const ShareModal: React.FC = () => {
  const { shareChat, unshareChat } = useActions();
  const [aiState] = useAIState<typeof AI>();
  const { id: chatId, shareId } = aiState;

  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<ShareModalLoadingStates>('');
  const isShared = shareId !== undefined;

  const handleShare = async () => {
    setIsLoading('share');
    await shareChat(chatId);
    setIsLoading('');
  };

  const handleRegenShare = async () => {
    setIsLoading('regen');
    await shareChat(chatId);
    setIsLoading('');
  };

  const handleUnshare = async () => {
    setIsLoading('unshare');
    await unshareChat(chatId);
    setIsLoading('');
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
      <Modal isOpen={isOpen} toggle={toggle}>
        <ModalHeader toggle={toggle}>Share Chat</ModalHeader>
        <ModalBody>
          <p>
            Sharing this chat will allow anyone with the link to view it. They
            will be able to see your name and the entire content of the chat.
            You will be able to delete the shared link or regenerate it at any
            time.
          </p>
          <SharedUrl
            shareId={shareId}
            isShared={isShared}
            handleRegenShare={handleRegenShare}
            handleUnshare={handleUnshare}
            isLoading={isLoading}
          />
        </ModalBody>
        <ModalFooter>
          {!isShared && (
            <ShareButton handleShare={handleShare} loadingState={isLoading} />
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
