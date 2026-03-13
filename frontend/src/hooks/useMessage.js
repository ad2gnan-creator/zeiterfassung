import { useState, useCallback } from 'react';

export function useMessage() {
  const [message, setMessage] = useState('');

  const showMessage = useCallback((msg, type = 'success') => {
    setMessage({ text: msg, type });
    setTimeout(() => setMessage(''), 3000);
  }, []);

  return { message, showMessage };
}
