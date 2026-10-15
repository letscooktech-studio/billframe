/**
 * NAVIGATION DRAWER CONTEXT
 * Provides global state and controls for opening and closing the
 * Searchable Side Navigation Drawer from any header, button, or route.
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface NavigationDrawerContextType {
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

const NavigationDrawerContext = createContext<NavigationDrawerContextType>({
  isOpen: false,
  openDrawer: () => {},
  closeDrawer: () => {},
  toggleDrawer: () => {},
});

export function NavigationDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openDrawer = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleDrawer = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return (
    <NavigationDrawerContext.Provider value={{ isOpen, openDrawer, closeDrawer, toggleDrawer }}>
      {children}
    </NavigationDrawerContext.Provider>
  );
}

export function useNavigationDrawer() {
  return useContext(NavigationDrawerContext);
}
