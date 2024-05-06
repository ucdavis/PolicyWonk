import React from 'react';

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

import ShareActions from './shareActions';

interface ShareModalProps {
  isOpen: boolean;
  toggle: (isOpen: boolean) => void;
  chatId: string;
  shareId: string | undefined;
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  toggle,
  chatId,
  shareId,
}) => {
  const { shareChat } = useActions();
  const url = window ? `${window.location.origin}/share/${shareId}` : '';
  return (
    <Modal isOpen={isOpen} toggle={() => toggle(!isOpen)}>
      <ModalHeader>Share Chat</ModalHeader>
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
              <ShareActions shareId={shareId} url={url} />
            </div>
          </InputGroup>
        )}
      </ModalBody>
      <ModalFooter>
        <Button
          color='primary'
          onClick={() => {
            shareChat(chatId);
          }}
        >
          Share
        </Button>
        <Button color='secondary' onClick={() => toggle(false)}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ShareModal;
