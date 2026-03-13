import { useState, useEffect } from 'react';

export function useDeviceType() {
  const [deviceType, setDeviceType] = useState(null);

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const platform = navigator.platform || '';
    
    // Check for iOS devices (including modern iPads)
    const isIOS = (
      // Traditional iOS detection
      (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) ||
      // Modern iPad detection (iPadOS 13+)
      (platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
      // Additional iOS platform checks
      /iPad|iPhone|iPod/.test(platform)
    );
    
    if (isIOS) {
      setDeviceType('ios');
    } else if (/android/i.test(userAgent)) {
      setDeviceType('android');
    } else {
      // Desktop or other devices - default to android mode for testing
      setDeviceType('android');
    }
  }, []);

  return deviceType;
}
