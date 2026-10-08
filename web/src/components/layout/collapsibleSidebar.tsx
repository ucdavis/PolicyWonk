'use client';
import React from 'react';

import { faBars } from '@fortawesome/free-solid-svg-icons';
import { usePathname } from 'next/navigation';

import { getGroupFromPathname } from '@/lib/groups';

import AggieIcon from '../ui/aggieIcon';

import {
  CollapsibleSidebarProvider,
  useCollapsibleSidebar,
} from './collapsibleSidebarProvider';
import Footer from './footer';

interface CollapsibleSidebarProps {
  children?: React.ReactNode;
  header?: React.ReactNode;
}

const CollapsibleSidebarComponent: React.FC<CollapsibleSidebarProps> = ({
  children,
  header,
}) => {
  const { isOpen, openSidebar, closeSidebar, isLargeScreen, sidebarRef } =
    useCollapsibleSidebar();
  const pathname = usePathname();
  const group = getGroupFromPathname(pathname);

  return (
    <>
      <nav
        className={`flex h-dvh shrink-0 flex-col overflow-hidden border-b-8 border-b-secondary bg-base-100 transition-[width,transform,opacity,border-color] duration-300 ease-out ${
          isOpen
            ? 'w-64 translate-x-0 border-r border-main-border opacity-100'
            : 'pointer-events-none w-0 -translate-x-full border-r border-transparent opacity-0'
        } ${isLargeScreen ? 'relative' : 'fixed inset-y-0 left-0 z-50 shadow-xl'}`}
        role='navigation'
        aria-label='Main sidebar'
        aria-hidden={!isOpen}
        inert={!isOpen}
        ref={sidebarRef}
      >
        <div
          className={`flex h-full w-64 flex-col transition-opacity ${
            isOpen
              ? 'delay-150 duration-150 opacity-100'
              : 'duration-75 opacity-0'
          }`}
        >
          <div className='shrink-0 px-4 pt-4 pb-4'>
            <div className='flex items-center gap-2'>
              {header && <div className='min-w-0 flex-1'>{header}</div>}
              <button
                className='ml-auto shrink-0 cursor-pointer p-0 text-base-content/75 hover:text-primary active:!bg-transparent'
                onClick={closeSidebar}
                aria-expanded={true}
                aria-controls='wonk-sidebar-main'
                title='Close sidebar'
              >
                <AggieIcon icon={faBars} isDecorative={true} />
              </button>
            </div>
          </div>
          <div
            id='wonk-sidebar-main'
            className='flex min-h-0 flex-1 flex-col overflow-hidden pt-1'
          >
            {children}
          </div>
          <Footer group={group} className='shrink-0 px-4 pb-4' />
        </div>
      </nav>
      {!isOpen && (
        <button
          className='fixed top-5 left-2 z-40 cursor-pointer rounded-box bg-base-100 p-2 text-base-content shadow-sm hover:text-primary active:!bg-transparent lg:absolute'
          onClick={openSidebar}
          aria-expanded={false}
          aria-controls='wonk-sidebar-main'
          title='Open sidebar'
        >
          <AggieIcon icon={faBars} isDecorative={true} />
        </button>
      )}
    </>
  );
};

interface CollapsibleSidebarContextProps extends CollapsibleSidebarProps {
  isMobile: boolean;
}

const CollapsibleSidebar: React.FC<CollapsibleSidebarContextProps> = ({
  isMobile,
  ...rest
}) => {
  return (
    <CollapsibleSidebarProvider isMobile={isMobile}>
      <CollapsibleSidebarComponent {...rest} />
    </CollapsibleSidebarProvider>
  );
};

export default CollapsibleSidebar;
