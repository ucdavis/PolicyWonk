'use client';
import React from 'react';

import { faRotateRight, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useActions } from 'ai/rsc';
import { AnimatePresence, motion } from 'framer-motion';
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
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  toggle,
  chatId,
  shareId,
}) => {
  const { shareChat, unshareChat } = useActions();
  const [url, setUrl] = React.useState<string>('');

  React.useEffect(() => {
    // we only care about the url when the modal is open and we have a shareId
    if (!shareId || !isOpen) {
      return;
    }

    // since window doesn't exist on the server, initialize this on first mount + on shareId change
    const newUrl = shareId ? `${window.location.origin}/share/${shareId}` : '';
    setUrl(newUrl);

    // when we get the response from the server, update the url and copy it
    navigator.clipboard.writeText(newUrl);
  }, [shareId, isOpen]);

  const handleShare = () => {
    setUrl('');
    shareChat(chatId);
  };

  return (
    <Modal isOpen={isOpen} toggle={() => toggle(!isOpen)}>
      <ModalHeader toggle={() => toggle(!isOpen)}>Share Chat</ModalHeader>
      <ModalBody>
        <p>
          Sharing this chat will allow anyone with the link to view it. They
          will be able to see your name and the entire content of the chat. You
          will be able to delete the shared link or regenerate it at any time.
        </p>
        <AnimatePresence mode='popLayout'>
          {shareId && (
            <motion.div
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -20,
              }}
              transition={{
                type: 'spring',
                stiffness: 100,
                damping: 10,
                ease: 'easeIn',
              }}
            >
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
                    animateOnEnter={true}
                    animateOnChange={true}
                    clearOnChange={true}
                  />
                  <AnimatedButton
                    displayBeforeClick={
                      <motion.div // rotate icon when we start regenerating link
                        variants={{
                          rotate: {
                            rotate: !url ? [0, 360] : 360,
                            transition: {
                              duration: 1,
                              repeat: 0,
                              ease: 'linear',
                            },
                          },
                        }}
                        initial={false}
                        animate='rotate'
                      >
                        <FontAwesomeIcon icon={faRotateRight} />
                      </motion.div>
                    }
                    onClick={handleShare}
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
            </motion.div>
          )}
        </AnimatePresence>
      </ModalBody>
      <ModalFooter>
        {!shareId && (
          <Button color='primary' onClick={handleShare}>
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
