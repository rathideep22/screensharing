import { useState, useEffect, useCallback, useRef } from 'react';

export const useMouseTracker = (isActive = false, testCallback = null) => {
  const [currentMousePos, setCurrentMousePos] = useState({ screenX: 0, screenY: 0 });
  const debounceTimerRef = useRef(null);
  const lastAlertRef = useRef(0);

  // Get screen information
  const getScreenInfo = useCallback(() => {
    if (typeof window !== 'undefined' && window.screen) {
      return {
        width: window.screen.width,
        height: window.screen.height,
        availWidth: window.screen.availWidth,
        availHeight: window.screen.availHeight
      };
    }
    return { width: 0, height: 0, availWidth: 0, availHeight: 0 };
  }, []);

  // Check if cursor is out of bounds
  const isOutOfBounds = useCallback((screenX, screenY) => {
    const screenInfo = getScreenInfo();
    
    return screenX < 0 || screenX > screenInfo.availWidth || 
           screenY < 0 || screenY > screenInfo.availHeight;
  }, [getScreenInfo]);

  // Show popup for multi-monitor detection
  const showMultiMonitorPopup = useCallback((screenX, screenY, availWidth, availHeight) => {
    // Prevent too many popups (max one every 3 seconds)
    const now = Date.now();
    if (now - lastAlertRef.current < 3000) return;
    
    lastAlertRef.current = now;
    
    // More detailed popup message
    const reason = [];
    if (screenX < 0) reason.push('left edge');
    if (screenX > availWidth) reason.push('right edge');
    if (screenY < 0) reason.push('top edge');
    if (screenY > availHeight) reason.push('bottom edge');
    
    alert(`⚠️ Multiple Monitor Used\n\nCursor detected outside screen boundaries (${reason.join(', ')}).\n\nCurrent position: X=${screenX}, Y=${screenY}\nValid range: X=0-${availWidth}, Y=0-${availHeight}\n\nPlease use only a single monitor.`);
    
    console.warn('🚨 Multiple monitor detected - cursor out of bounds:', { screenX, screenY, availWidth, availHeight, reason });
  }, []);

  // Handle mouse movement
  const handleMouseMove = useCallback((event) => {
    const { screenX, screenY } = event;
    
    // Always update current position for live tracking
    setCurrentMousePos({ screenX, screenY });

    if (!isActive) return;
    
          if (isOutOfBounds(screenX, screenY)) {
        // Clear existing timer
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        // Debounce detection to avoid false positives
        debounceTimerRef.current = setTimeout(() => {
          const screenInfo = getScreenInfo();
          showMultiMonitorPopup(screenX, screenY, screenInfo.availWidth, screenInfo.availHeight);
        }, 300);
    } else {
      // Clear timer if back in bounds
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    }
  }, [isActive, isOutOfBounds, showMultiMonitorPopup]);

  // Set up mouse tracking - always active for live coordinate display
  useEffect(() => {
    // Add mouse move listener for live tracking
    document.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Cleanup function
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [handleMouseMove]);

  // Function to test detection with custom coordinates
  const testDetection = useCallback((testScreenX, testScreenY) => {
    if (isOutOfBounds(testScreenX, testScreenY)) {
      const screenInfo = getScreenInfo();
      showMultiMonitorPopup(testScreenX, testScreenY, screenInfo.availWidth, screenInfo.availHeight);
      return true;
    }
    return false;
  }, [isOutOfBounds, showMultiMonitorPopup, getScreenInfo]);

  // Register test callback
  useEffect(() => {
    if (testCallback) {
      testCallback(testDetection);
    }
  }, [testCallback, testDetection]);

  return {
    // Simple return - just the tracking status and screen info
    isTracking: isActive,
    screenInfo: getScreenInfo(),
    testDetection,
    currentMousePos
  };
}; 