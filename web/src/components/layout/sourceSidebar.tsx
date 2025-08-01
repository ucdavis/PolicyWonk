'use client';
import React from 'react';

import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

import { MemoizedReactMarkdown } from '../../lib/markdown';

interface SourceSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDoc: { title: string; content: string; url: string } | null;
}

const SourceSidebar: React.FC<SourceSidebarProps> = ({
  isOpen,
  onClose,
  selectedDoc,
}) => {
  return (
    <>
      <div className={`source-sidebar-wrapper ${isOpen ? 'open' : ''}`}>
        <div className='source-sidebar-header'>
          <button onClick={onClose} className='text-gray-600 hover:text-black'>
            ✕ Close
          </button>
        </div>
        <div className='source-sidebar-main'>
          {selectedDoc && (
            <>
              <h2 className='text-xl font-bold mb-4'>{selectedDoc.title}</h2>
              <MemoizedReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
              >
                {selectedDoc.content}
              </MemoizedReactMarkdown>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default React.memo(SourceSidebar);
