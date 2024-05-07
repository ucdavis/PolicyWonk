import React from 'react';

import { faRotateRight, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useActions } from 'ai/rsc';
import {
  Button,
  Input,
  InputGroup,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from 'reactstrap';

import AnimatedButton from '../ui/animatedButton';
import CopyToClipboardButton from '../ui/copyToClipboardButton';

interface ShareModalProps {
  isOpen: boolean;
  toggle: (isOpen: boolean) => void;
  chatId: string;
  shareId: string | undefined;
  url: string;
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  toggle,
  chatId,
  shareId,
  url,
}) => {
  const { shareChat, unshareChat } = useActions();

  return (
    <Modal isOpen={isOpen} toggle={() => toggle(!isOpen)}>
      <ModalHeader toggle={() => toggle(!isOpen)}>Share Chat</ModalHeader>
      <ModalBody>
        <p>
          Sharing this chat will allow anyone with the link to view it. They
          will be able to see your name and the entire content of the chat. You
          will be able to delete the shared link or regenerate it at any time.
        </p>
        {shareId && (
          <InputGroup>
            <Input
              className='custom-input-height'
              value={url}
              readOnly={true}
            />
            <div className='ms-2'>
              <CopyToClipboardButton
                value={url}
                id='share-copy-url'
                selected={true}
                animateOnEnter={true}
              />
              <AnimatedButton
                displayBeforeClick={<FontAwesomeIcon icon={faRotateRight} />}
                onClick={() => {
                  shareChat(chatId);
                }}
                title={'Regenerate share link'}
              />
              <AnimatedButton
                displayBeforeClick={<FontAwesomeIcon icon={faTrash} />}
                onClick={() => {
                  unshareChat(chatId);
                }}
                title={'Delete share link'}
              />
            </div>
          </InputGroup>
        )}
      </ModalBody>
      <ModalFooter>
        {!shareId && (
          <Button
            color='primary'
            onClick={() => {
              shareChat(chatId);
            }}
          >
            Share
          </Button>
        )}
        <Button color='secondary' onClick={() => toggle(false)}>
          {!shareId ? 'Cancel' : 'Close'}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ShareModal;
