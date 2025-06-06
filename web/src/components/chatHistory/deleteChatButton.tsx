'use client';
import React from 'react';

import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';

import { deleteChatFromSidebar } from '../../lib/actions';
import { checkActiveChat } from '../../lib/util';
import { IconVariants, IconVariantOptions } from '../../models/animations';
import AnimatedButton from '../ui/animatedButton';

interface DeleteChatButtonProps {
  chatId: string;
  isHovering: boolean;
}

const DeleteChatButton: React.FC<DeleteChatButtonProps> = ({
  chatId,
  isHovering,
}) => {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const pathname = usePathname();

  const router = useRouter();

  const handleRemoveChat = async (chatId: string) => {
    const isActiveChat = checkActiveChat(pathname, chatId);
    setIsLoading(true);
    // TODO: handle errors, set isLoading to false on err
    await deleteChatFromSidebar(chatId, isActiveChat);
    // don't set isLoading to false here because the page will refresh, and component will unmount
    // if multiple deletes are queued at once, the refresh won't happen until the last one completes
    if (isActiveChat) {
      router.prefetch(`/chat/new`);
      // deleteChatFromSidebar will handle the redirect to '/'
      // because i could not get the router here to both refresh and redirect reliably
    } else {
      router.refresh();
    }
  };

  const adjustedVariant = IconVariants;
  adjustedVariant.bounce = {
    ...adjustedVariant.bounce,
    y: [0, -3, 0],
  };
  return (
    <div className='col-1 delete-chat-button'>
      {(isHovering || isLoading) && (
        <AnimatedButton
          className='btn btn-link btn-trash'
          color='link'
          displayBeforeClick={
            <motion.div
              variants={IconVariants}
              initial={false}
              animate={
                isLoading
                  ? adjustedVariant.bounce
                  : IconVariantOptions.bounceStop
              }
            >
              <FontAwesomeIcon icon={faTrash} size='md' />
            </motion.div>
          }
          onClick={() => handleRemoveChat(chatId)}
          title={'Delete share link'}
          disabled={isLoading}
        />
      )}
    </div>
  );
};

export default DeleteChatButton;
