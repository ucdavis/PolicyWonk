'use client';
import React, { useState, useEffect } from 'react';

import { StreamableValue } from 'ai/rsc';

import WonkyClientError from '../../../lib/error/wonkyClientError';
import WonkyErrorBoundary from '../../../lib/error/wonkyErrorBoundary';
import { useStreamableText } from '../../../lib/hooks/useStreamableText';
import SourceSidebar from '../../layout/sourceSidebar';

import ChatActions from './chatActions';
import WonkAnswer from './wonkAnswer';

export const WonkMessage = ({
  content,
  isLoading,
  wonkThoughts,
  citationDocs,
}: {
  content: string | StreamableValue<string>;
  isLoading: boolean;
  wonkThoughts: StreamableValue<string> | string;
  citationDocs?: {
    title: string;
    content: string;
    url: string;
  }[];
}) => {
  const text = useStreamableText(content);
  const wonkText = useStreamableText(wonkThoughts, { shouldAppend: false });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  useEffect(() => {}, [isSidebarOpen]);
  const [selectedDoc, setSelectedDoc] = useState<{
    title: string;
    content: string;
    url: string;
  } | null>(null);

  const onCitationClick = (citationHref: string) => {
    if (!citationDocs) {
      return;
    }

    const doc = citationDocs.find((d) => d.url === citationHref);
    if (doc) {
      setSelectedDoc(doc);
      setIsSidebarOpen(true);
    } else {
    }
  };

  return (
    <div
      className={`main-content-wrapper ${isSidebarOpen ? 'sidebar-open' : ''}`}
    >
      <div className='chat-row'>
        <div className='d-flex'>
          <div>
            {text ? (
              <WonkyErrorBoundary
                fallback={
                  <WonkyClientError
                    type='alert'
                    thereWasAnErrorLoadingThe='answer'
                  />
                }
              >
                <WonkAnswer text={text} onCitationClick={onCitationClick} />
              </WonkyErrorBoundary>
            ) : (
              wonkText
            )}
          </div>
        </div>
        {!isLoading && <ChatActions />}
      </div>
      <SourceSidebar
        isOpen={isSidebarOpen}
        onClose={() => {
          setIsSidebarOpen(false);
          setSelectedDoc(null);
        }}
        selectedDoc={isSidebarOpen ? selectedDoc : null}
      />
    </div>
  );
};
