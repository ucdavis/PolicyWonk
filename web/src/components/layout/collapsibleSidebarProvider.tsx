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

const subscribeViewport = (onChange: () => void) => {
  window.addEventListener('resize', onChange);
  return () => window.removeEventListener('resize', onChange);
};
const getViewportIsLarge = () => isSidebarLargeScreen(window.innerWidth);

export const CollapsibleSidebarProvider: React.FC<{
  children: React.ReactNode;
  isMobile: boolean;
}> = ({ children, isMobile }) => {
  const isLargeScreen = React.useSyncExternalStore(
    subscribeViewport,
    getViewportIsLarge,
    () => !isMobile
  );
  const [openState, setOpenState] = React.useState({
    large: !isMobile,
    open: !isMobile,
  });
  const isOpen =
    openState.large === isLargeScreen ? openState.open : isLargeScreen;
  const setIsOpen = React.useCallback(
    (open: boolean) => setOpenState({ large: getViewportIsLarge(), open }),
    []
  );
  const sidebarRef = React.useRef<HTMLElement | null>(null);
  const onNavigate = (callback: () => void) => {
    if (!isLargeScreen) {
      setIsOpen(false);
    }
    callback();
  };

  React.useEffect(() => {
    const handleResize = () => setIsOpen(getViewportIsLarge());
    const handleClickOutside = (event: MouseEvent) => {
      if (
        !getViewportIsLarge() &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setIsOpen]);

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
  }, [isLargeScreen, isOpen, setIsOpen]);

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
