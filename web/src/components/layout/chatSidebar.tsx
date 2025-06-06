'use client';
import React from 'react';

import CollapsibleSidebar from './collapsibleSidebar';

interface ChatSidebarProps {
  isMobile: boolean;
  children?: React.ReactNode;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ isMobile, children }) => {
  return (
    <CollapsibleSidebar isMobile={isMobile} hideNewChatButton={false}>
      {children}
    </CollapsibleSidebar>
  );
};

export default ChatSidebar;
