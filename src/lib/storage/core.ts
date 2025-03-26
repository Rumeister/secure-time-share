
import { MessageData } from './types';

/**
 * Gets all messages from localStorage
 */
export const getAllMessages = (): MessageData[] => {
  try {
    const messagesString = localStorage.getItem('secureMessages');
    if (!messagesString) {
      console.log("No 'secureMessages' found in localStorage");
      localStorage.setItem('secureMessages', '[]');
      return [];
    }
    
    // Check if the string is just an empty array
    if (messagesString === '[]') {
      console.log("'secureMessages' is an empty array");
      return [];
    }
    
    const messages = JSON.parse(messagesString);
    if (!Array.isArray(messages)) {
      console.warn("'secureMessages' is not an array, resetting to empty array");
      localStorage.setItem('secureMessages', '[]');
      return [];
    }
    
    if (messages.length === 0) {
      console.log("'secureMessages' is an empty array");
    } else {
      console.log(`Retrieved ${messages.length} messages from localStorage`);
    }
    
    return messages;
  } catch (error) {
    console.error('Error getting messages:', error);
    // Reset the storage if there's corruption
    console.warn("Error parsing messages, resetting storage to empty array");
    localStorage.setItem('secureMessages', '[]');
    return [];
  }
};

/**
 * Gets the current user ID if signed in
 */
export const getUserId = (): string | null => {
  try {
    const userString = localStorage.getItem('clerk-user');
    if (!userString) return null;
    
    const user = JSON.parse(userString);
    return user?.id || null;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
};

/**
 * Initialize storage to ensure it exists and is valid
 */
export function initializeStorage(): boolean {
  try {
    // Ensure secureMessages exists in localStorage
    const messagesStr = localStorage.getItem('secureMessages');
    if (!messagesStr) {
      // Create it if it doesn't exist
      localStorage.setItem('secureMessages', '[]');
      console.log("Initialized empty secureMessages array");
      return true;
    } else if (messagesStr === '[]') {
      // Already exists as empty array
      console.log("secureMessages already exists as empty array");
      return true;
    } else {
      // Try to parse it to make sure it's valid
      try {
        const parsed = JSON.parse(messagesStr);
        if (!Array.isArray(parsed)) {
          console.warn("secureMessages is not an array, resetting to empty array");
          localStorage.setItem('secureMessages', '[]');
        } else {
          console.log(`secureMessages contains ${parsed.length} messages`);
        }
        return true;
      } catch (e) {
        console.error("Error parsing secureMessages, resetting:", e);
        localStorage.setItem('secureMessages', '[]');
        return false;
      }
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
    return false;
  }
}

/**
 * Force reload storage
 */
export function forceReloadStorage(): boolean {
  try {
    // Get the current messages
    const messagesStr = localStorage.getItem('secureMessages');
    if (!messagesStr || messagesStr === '[]') {
      console.log("No messages to reload");
      return false;
    }
    
    // Try parsing them
    let messages: MessageData[] = [];
    try {
      messages = JSON.parse(messagesStr);
      if (!Array.isArray(messages) || messages.length === 0) {
        console.log("No valid messages to reload");
        return false;
      }
    } catch (e) {
      console.error("Error parsing messages:", e);
      return false;
    }
    
    // Force rewrite them to storage
    localStorage.setItem('secureMessages', JSON.stringify(messages));
    console.log(`Forced reload of ${messages.length} messages`);
    
    return true;
  } catch (error) {
    console.error('Error forcing reload storage:', error);
    return false;
  }
}

/**
 * Get the total number of messages and keys in storage (for debugging)
 */
export const getStorageStats = () => {
  try {
    const messages = getAllMessages();
    
    const keysStore = localStorage.getItem('secureMessageKeys') || '{}';
    let keys = {};
    try {
      keys = JSON.parse(keysStore);
    } catch (e) {
      keys = {};
    }
    
    return {
      messages: messages.length,
      keys: Object.keys(keys).length,
      totalItems: localStorage.length
    };
  } catch (error) {
    console.error('Error getting storage stats:', error);
    return { messages: 0, keys: 0, totalItems: 0 };
  }
};
