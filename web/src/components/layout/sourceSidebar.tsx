'use client';
import React from 'react';

import { faClose } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
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
          <h2 className='sidebar-title'>
            <a
              href={selectedDoc?.url}
              target='_blank'
              rel='noopener noreferrer'
            >
              {selectedDoc?.title}
            </a>
          </h2>
          <button onClick={onClose} className='sidebar-close'>
            <FontAwesomeIcon icon={faClose} />
          </button>
        </div>
        <div className='source-sidebar-main'>
          {selectedDoc && (
            <>
              <MemoizedReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSlug, rehypeAutolinkHeadings]}
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
