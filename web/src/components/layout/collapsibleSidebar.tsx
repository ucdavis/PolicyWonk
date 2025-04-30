'use client';
import React from 'react';

import { faBars, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { AnimatePresence, motion, Transition, Variants } from 'framer-motion';
import Link from 'next/link';

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

  return (
    <>
      <motion.nav
        className={`aggie-sidebar-wrapper${className ? ` ${className}` : ''}`}
        role='navigation'
        aria-label='Main sidebar'
        initial={false}
        animate={isOpen ? 'open' : 'closed'}
        variants={isLargeScreen ? sidebarVariants : sidebarVariantsMobile}
        transition={transition}
        layout
        layoutId='aggie-sidebar'
        ref={sidebarRef}
      >
        {isOpen && (
          <motion.div
            layout='position'
            className='aggie-sidebar-header d-flex align-items-center justify-content-between container'
          >
            <button
              className='btn btn-icon btn-lg btn-link'
              onClick={closeSidebar}
              aria-expanded={true}
              aria-controls='aggie-sidebar-main'
              title='close sidebar'
            >
              <AggieIcon icon={faBars} isDecorative={true} />
            </button>
            {!hideNewChatButton && (
              <Link
                className='btn btn-icon btn-lg btn-link'
                onClick={() => {
                  if (!isLargeScreen) {
                    closeSidebar();
                  }
                }}
                href={'/chat/new'}
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
              key='aggie-sidebar-main'
              id='aggie-sidebar-main'
              className='aggie-sidebar-main container'
              initial='hidden'
              animate='open'
              exit={isLargeScreen ? 'hidden' : ''}
              variants={sidebarContentVariants}
              transition={transition}
            >
              {children}
              <Footer />
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
              aria-controls='aggie-sidebar-main'
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
