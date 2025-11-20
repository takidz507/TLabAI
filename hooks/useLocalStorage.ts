import { useState, useEffect } from 'react';
import { encryptData, decryptData } from '../utils/encryption';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Get from local storage then parse it (with Decryption)
  const readValue = (): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      // Pass the item to decryptData. 
      // If it's null, returns initialValue.
      // If it's plain JSON (old data), it parses it.
      // If it's encrypted, it decrypts it.
      return decryptData(item, initialValue);
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  };

  const [storedValue, setStoredValue] = useState<T>(readValue);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        // ENCRYPT BEFORE SAVING
        const encrypted = encryptData(valueToStore);
        window.localStorage.setItem(key, encrypted);
      }
    } catch (error) {
      console.warn(`Error setting localStorage key “${key}”:`, error);
    }
  };

  useEffect(() => {
    setStoredValue(readValue());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [storedValue, setValue];
}