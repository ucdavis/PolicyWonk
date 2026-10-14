'use client';
import React from 'react';

import CollapsibleSidebar from './collapsibleSidebar';
import SiteBrand from './siteBrand';

interface ChatSidebarProps {
  isMobile: boolean;
  children?: React.ReactNode;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ isMobile, children }) => {
  return (
    <CollapsibleSidebar isMobile={isMobile} header={<SiteBrand />}>
      {children}
    </CollapsibleSidebar>
  );
};

export default ChatSidebar;
