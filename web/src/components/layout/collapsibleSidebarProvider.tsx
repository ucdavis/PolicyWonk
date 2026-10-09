import React from 'react';

interface SidebarContextProps {
  isOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  isLargeScreen: boolean;
  sidebarRef: React.RefObject<HTMLElement | null>;
  onNavigate: (callback: () => void) => void;
}

export const CollapsibleSidebarContext = React.createContext<
  SidebarContextProps | undefined
>(undefined);

export const sidebarBreakpoint = 1024;

export const isSidebarLargeScreen = (viewportWidth: number) =>
  viewportWidth >= sidebarBreakpoint;

export const CollapsibleSidebarProvider: React.FC<{
  children: React.ReactNode;
  isMobile: boolean;
}> = ({ children, isMobile }) => {
  const [isLargeScreen, setIsLargeScreen] = React.useState(!isMobile);
  const [isOpen, setIsOpen] = React.useState(!isMobile);
  const sidebarRef = React.useRef<HTMLElement | null>(null);
  const isLargeScreenRef = React.useRef(isLargeScreen); // Ref to track isLargeScreen state

  React.useEffect(() => {
    // update the ref so that we can use it in the event listener
    isLargeScreenRef.current = isLargeScreen;
  }, [isLargeScreen]);

  const handleResize = () => {
    if (isSidebarLargeScreen(window.innerWidth)) {
      setIsLargeScreen(true);
      setIsOpen(true);
    } else {
      setIsLargeScreen(false);
      setIsOpen(false);
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      !isLargeScreenRef.current &&
      sidebarRef.current &&
      !sidebarRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  };

  const onNavigate = (callback: () => void) => {
    if (!isLargeScreen) {
      setIsOpen(false);
    }
    callback();
  };

  React.useEffect(() => {
    const viewportIsLarge = isSidebarLargeScreen(window.innerWidth);
    setIsLargeScreen(viewportIsLarge);
    setIsOpen(viewportIsLarge);
    window.addEventListener('resize', handleResize);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  React.useEffect(() => {
    if (isLargeScreen || !isOpen) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.body.dataset.sidebarScrollLock = 'true';
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      delete document.body.dataset.sidebarScrollLock;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isLargeScreen, isOpen]);

  return (
    <CollapsibleSidebarContext.Provider
      value={{
        isOpen,
        openSidebar: () => setIsOpen(true),
        closeSidebar: () => setIsOpen(false),
        isLargeScreen,
        sidebarRef,
        onNavigate,
      }}
    >
      {children}
    </CollapsibleSidebarContext.Provider>
  );
};

export const useCollapsibleSidebar = (): SidebarContextProps => {
  const context = React.useContext(CollapsibleSidebarContext);
  if (!context) {
    throw new Error(
      'useCollapsibleSidebar must be used within a CollapsibleSidebarProvider'
    );
  }
  return context;
};
