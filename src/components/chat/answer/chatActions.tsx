'use client';
import React from 'react';

import { usePathname } from 'next/navigation';

import FeedbackBar from '@/components/chat/answer/feedbackBar';
import CopyToClipboardButton from '@/components/ui/copyToClipboardButton';

import FeedbackButtons from './feedbackButtons';
import ShareModal from './shareModal';

interface ChatActionsProps {
  chatId: string;
  content: string;
}

const ChatActions: React.FC<ChatActionsProps> = ({ chatId, content }) => {
  const pathname = usePathname();
  const onSharedPage = pathname.includes('/share/');

  return (
    <>
      <div className='row mb-3'>
        <div className='col-1'>{/* empty */}</div>
        <div className='col-11'>
          <CopyToClipboardButton id={chatId} value={content} />
          {!onSharedPage && (
            <>
              <FeedbackButtons onSharedPage={onSharedPage} />
              <ShareModal />
            </>
          )}
        </div>
      </div>
      {!onSharedPage && <FeedbackBar />}
    </>
  );
};

export default ChatActions;
