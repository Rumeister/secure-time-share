
import { MessageData } from './types';

/**
 * Initializes the storage system
 * Ensures that the basic storage containers exist
 */
export const initializeStorage = (): boolean => {
  try {
    // Check if 'secureMessages' exists and initialize if not
    const messagesStr = localStorage.getItem('secureMessages');
    if (!messagesStr) {
      localStorage.setItem('secureMessages', '[]');
      console.log("Initialized empty secureMessages array");
    }
    
    // Check if 'secureMessageKeys' exists and initialize if not
    const keysStr = localStorage.getItem('secureMessageKeys');
    if (!keysStr) {
      localStorage.setItem('secureMessageKeys', '{}');
      console.log("Initialized empty secureMessageKeys object");
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing storage:', error);
    return false;
  }
};

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
 * Gets all messages for the current user
 */
export const getUserMessages = (): MessageData[] => {
  const userId = getUserId();
  if (!userId) return [];
  
  try {
    const userMessagesString = localStorage.getItem(`userMessages_${userId}`);
    if (!userMessagesString) return [];
    
    const userMessages = JSON.parse(userMessagesString);
    return Array.isArray(userMessages) ? userMessages : [];
  } catch (error) {
    console.error('Error getting user messages:', error);
    return [];
  }
};

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
