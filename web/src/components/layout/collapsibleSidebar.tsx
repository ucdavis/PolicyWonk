'use client';
import React from 'react';

import { faBars, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { AnimatePresence, motion, Transition, Variants } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { getGroupFromPathname } from '@/lib/groups';

import AggieIcon from '../ui/aggieIcon';

import {
  CollapsibleSidebarProvider,
  useCollapsibleSidebar,
} from './collapsibleSidebarProvider';
import Footer from './footer';

interface CollapsibleSidebarProps {
  hideNewChatButton?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const CollapsibleSidebarComponent: React.FC<CollapsibleSidebarProps> = ({
  hideNewChatButton = false,
  children,
  className,
}) => {
  const { isOpen, openSidebar, closeSidebar, isLargeScreen, sidebarRef } =
    useCollapsibleSidebar();

  const pathname = usePathname();
  const group = getGroupFromPathname(pathname);

  const newChatUrl = group ? `/${group}/chat/new` : '/chat/new';

  return (
    <>
      <motion.nav
        className={`wonk-sidebar-wrapper${className ? ` ${className}` : ''}`}
        role='navigation'
        aria-label='Main sidebar'
        initial={false}
        animate={isOpen ? 'open' : 'closed'}
        variants={isLargeScreen ? sidebarVariants : sidebarVariantsMobile}
        transition={transition}
        layout
        layoutId='wonk-sidebar'
        ref={sidebarRef}
      >
        {isOpen && (
          <motion.div
            layout='position'
            className='wonk-sidebar-header d-flex align-items-center justify-content-between container'
          >
            <button
              className='btn btn-icon btn-lg btn-link'
              onClick={closeSidebar}
              aria-expanded={true}
              aria-controls='wonk-sidebar-main'
              title='close sidebar'
            >
              <AggieIcon icon={faBars} isDecorative={true} />
            </button>
            {!hideNewChatButton && (
              <Link
                className='btn btn-icon btn-lg btn-link'
                onClick={() => {
                  if (window.location.pathname === newChatUrl) {
                    window.location.assign(newChatUrl);
                  } else if (!isLargeScreen) {
                    closeSidebar();
                  }
                }}
                href={newChatUrl}
                title='Start a new chat'
              >
                <AggieIcon icon={faPenToSquare} isDecorative={true} />
              </Link>
            )}
          </motion.div>
        )}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              key='wonk-sidebar-main'
              id='wonk-sidebar-main'
              className='wonk-sidebar-main'
              initial='hidden'
              animate='open'
              exit={isLargeScreen ? 'hidden' : ''}
              variants={sidebarContentVariants}
              transition={transition}
            >
              {children}
              <Footer group={group} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            animate={isOpen ? 'open' : 'closed'}
            variants={collapseButtonVariants}
            initial={false}
            transition={transition}
          >
            <button
              className='btn-open-sidebar btn btn-icon btn-lg btn-link'
              onClick={openSidebar}
              aria-expanded={false}
              aria-controls='wonk-sidebar-main'
              title='Open Sidebar'
            >
              <AggieIcon icon={faBars} isDecorative={true} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
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

const transition: Transition = {
  type: 'tween',
  ease: 'easeOut',
  duration: 0.3,
};

const sidebarVariants: Variants = {
  open: {
    width: 'var(--sidebar-width-open)',
    position: 'relative',
    display: 'block',
  },
  closed: {
    width: 0,
    position: 'relative',
    display: 'none',
  },
};

const sidebarVariantsMobile: Variants = {
  open: {
    ...sidebarVariants.open,
    position: 'absolute',
    zIndex: 1000,
  },
  closed: {
    ...sidebarVariants.closed,
    position: 'absolute',
    display: 'block',
    transition: {
      ...transition,
    },
    transitionEnd: {
      position: 'relative',
      display: 'none',
      zIndex: 0,
    },
  },
};

const sidebarContentVariants: Variants = {
  open: {
    x: 0,
    width: 'var(--sidebar-width-open)',
  },
  hidden: {
    x: '-130%',
    width: 'var(--sidebar-width-open)',
  },
};

const collapseButtonVariants: Variants = {
  open: {
    display: 'none',
  },
  closed: {
    display: 'block',
  },
};
