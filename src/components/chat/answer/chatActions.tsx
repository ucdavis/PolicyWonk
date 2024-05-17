'use client';
import React from 'react';

import { useAIState } from 'ai/rsc';
import { usePathname } from 'next/navigation';

import FeedbackBar from '@/components/chat/answer/feedbackBar';
import CopyToClipboardButton from '@/components/ui/copyToClipboardButton';
import { AI } from '@/lib/actions';
import { getFullQuestionAndAnswer } from '@/lib/util';

import FeedbackButtons from './feedbackButtons';
import ShareModal from './shareModal';

interface ChatActionsProps {
  chatId: string;
}

const ChatActions: React.FC<ChatActionsProps> = ({ chatId }) => {
  const pathname = usePathname();
  const onSharedPage = pathname.includes('/share/');
  const [aiState] = useAIState<typeof AI>();

  return (
    <>
      <div className='row mb-3'>
        <div className='col-1'>{/* empty */}</div>
        <div className='col-11'>
          <CopyToClipboardButton
            id='gtag-copy-chat'
            value={getFullQuestionAndAnswer(aiState)}
          />
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
