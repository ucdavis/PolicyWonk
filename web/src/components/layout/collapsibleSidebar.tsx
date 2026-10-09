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

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

const CollapsibleSidebarComponent: React.FC<CollapsibleSidebarProps> = ({
  children,
  header,
}) => {
  const { isOpen, openSidebar, closeSidebar, isLargeScreen, sidebarRef } =
    useCollapsibleSidebar();
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const openButtonRef = React.useRef<HTMLButtonElement>(null);
  const previousDrawerStateRef = React.useRef({ isOpen, isLargeScreen });
  const pathname = usePathname();
  const group = getGroupFromPathname(pathname);

  React.useEffect(() => {
    const previousDrawerState = previousDrawerStateRef.current;

    if (
      !isLargeScreen &&
      isOpen &&
      (!previousDrawerState.isOpen || previousDrawerState.isLargeScreen)
    ) {
      closeButtonRef.current?.focus();
    }

    if (
      !isLargeScreen &&
      !isOpen &&
      previousDrawerState.isOpen &&
      !previousDrawerState.isLargeScreen
    ) {
      openButtonRef.current?.focus();
    }

    previousDrawerStateRef.current = { isOpen, isLargeScreen };
  }, [isLargeScreen, isOpen]);

  React.useEffect(() => {
    if (!isOpen || isLargeScreen) {
      return;
    }

    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') {
        return;
      }

      const focusableElements =
        sidebarRef.current?.querySelectorAll<HTMLElement>(focusableSelector);

      if (!focusableElements?.length) {
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', trapFocus);

    return () => document.removeEventListener('keydown', trapFocus);
  }, [isLargeScreen, isOpen, sidebarRef]);

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
                ref={closeButtonRef}
                type='button'
                className='ml-auto flex size-11 shrink-0 cursor-pointer items-center justify-center text-base-content/75 hover:text-primary active:!bg-transparent lg:size-9'
                onClick={closeSidebar}
                aria-expanded={true}
                aria-controls='wonk-sidebar-main'
                aria-label='Close sidebar'
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
      {isOpen && !isLargeScreen && (
        <button
          type='button'
          className='fixed inset-0 z-40 cursor-default bg-neutral/20'
          onClick={closeSidebar}
          aria-label='Close sidebar'
        />
      )}
      {!isOpen && (
        <button
          ref={openButtonRef}
          type='button'
          className='fixed top-3 left-2 z-40 flex size-11 cursor-pointer items-center justify-center text-base-content hover:text-primary active:!bg-transparent lg:absolute lg:top-5 lg:size-10'
          onClick={openSidebar}
          aria-expanded={false}
          aria-controls='wonk-sidebar-main'
          aria-label='Open sidebar'
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
