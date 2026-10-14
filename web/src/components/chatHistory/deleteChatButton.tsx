'use client';
import React from 'react';

import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { usePathname, useRouter } from 'next/navigation';

import { deleteChatFromSidebar } from '../../lib/actions';
import { checkActiveChat } from '../../lib/util';
import { useCollapsibleSidebar } from '../layout/collapsibleSidebarProvider';

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
  const { onNavigate } = useCollapsibleSidebar();

  const handleRemoveChat = async () => {
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

  if (!isHovering && !isLoading) {
    return null;
  }

  return (
    <div className='absolute inset-y-0 right-0 z-10 flex items-center rounded-r-lg bg-base-300 px-2'>
      <button
        className='btn btn-link btn-square btn-sm text-base-content/70 hover:text-error'
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (checkActiveChat(pathname, chatId)) {
            onNavigate(handleRemoveChat);
          } else {
            void handleRemoveChat();
          }
        }}
        title='Delete chat'
        aria-label='Delete chat'
        disabled={isLoading}
      >
        <FontAwesomeIcon icon={faTrash} spin={isLoading} />
      </button>
    </div>
  );
};

export default DeleteChatButton;
