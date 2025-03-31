import { MessageData } from './types';
import { getAllMessages, getUserId } from './core';
import { removeEncryptionKey, storeEncryptionKey } from './keys';

/**
 * Saves a message to localStorage with verification
 */
export const saveMessage = (message: MessageData): boolean => {
  try {
    // Get existing messages
    const messages = getAllMessages();
    
    // Check if message already exists
    if (messages.some(m => m.id === message.id)) {
      console.warn(`Message with ID ${message.id} already exists`);
      return false;
    }
    
    // Add the new message
    messages.push(message);
    
    // Save back to localStorage
    localStorage.setItem('secureMessages', JSON.stringify(messages));
    console.log(`Message with ID ${message.id} saved successfully`);
    return true;
  } catch (error) {
    console.error('Error saving message:', error);
    return false;
  }
};

/**
 * Retrieves a message by ID from localStorage
 */
export const getMessage = (id: string): MessageData | undefined => {
  try {
    const messages = getAllMessages();
    const message = messages.find(m => m.id === id);
    
    if (!message) {
      console.warn(`Message with ID ${id} not found`);
      return undefined;
    }
    
    console.log(`Message with ID ${id} retrieved successfully`);
    return message;
  } catch (error) {
    console.error('Error getting message:', error);
    return undefined;
  }
};

/**
 * Updates a message in localStorage
 */
export const updateMessage = (updatedMessage: MessageData) => {
  try {
    const messages = getAllMessages();
    const index = messages.findIndex(m => m.id === updatedMessage.id);
    
    if (index === -1) {
      console.warn(`Message with ID ${updatedMessage.id} not found for update`);
      return;
    }
    
    messages[index] = updatedMessage;
    localStorage.setItem('secureMessages', JSON.stringify(messages));
    console.log(`Message with ID ${updatedMessage.id} updated successfully`);
  } catch (error) {
    console.error('Error updating message:', error);
  }
};

/**
 * Deletes a message from localStorage
 */
export const deleteMessage = (id: string) => {
  try {
    const messages = getAllMessages();
    const updatedMessages = messages.filter(m => m.id !== id);
    
    localStorage.setItem('secureMessages', JSON.stringify(updatedMessages));
    removeEncryptionKey(id); // Also remove the encryption key
    
    console.log(`Message with ID ${id} deleted successfully`);
  } catch (error) {
    console.error('Error deleting message:', error);
  }
};

/**
 * Share a message with a specific user
 */
export const shareMessageWithUser = (messageId: string, userId: string) => {
  try {
    const message = getMessage(messageId);
    if (!message) {
      console.warn(`Message with ID ${messageId} not found`);
      return;
    }
    
    // Ensure sharedWithUsers is initialized
    message.sharedWithUsers = message.sharedWithUsers || [];
    
    // Prevent duplicate sharing
    if (message.sharedWithUsers.includes(userId)) {
      console.warn(`Message with ID ${messageId} already shared with user ${userId}`);
      return;
    }
    
    message.sharedWithUsers.push(userId);
    updateMessage(message);
    
    console.log(`Message with ID ${messageId} shared with user ${userId}`);
  } catch (error) {
    console.error('Error sharing message:', error);
  }
};

/**
 * Get messages shared with the current user
 */
export const getSharedMessages = (): MessageData[] => {
  const userId = getUserId();
  if (!userId) return [];
  
  try {
    const messages = getAllMessages();
    const sharedMessages = messages.filter(message => message.sharedWithUsers?.includes(userId));
    console.log(`Retrieved ${sharedMessages.length} messages shared with user ${userId}`);
    return sharedMessages;
  } catch (error) {
    console.error('Error getting shared messages:', error);
    return [];
  }
};

/**
 * Increments the view count of a message and returns the updated message
 */
export const incrementMessageViews = (id: string): MessageData | undefined => {
  try {
    const message = getMessage(id);
    if (!message) {
      console.warn(`Message with ID ${id} not found`);
      return undefined;
    }
    
    message.currentViews = (message.currentViews || 0) + 1;
    updateMessage(message);
    
    console.log(`View count incremented for message ID ${id}, current views: ${message.currentViews}`);
    return message;
  } catch (error) {
    console.error('Error incrementing view count:', error);
    return undefined;
  }
};

/**
 * Checks if a message has expired based on maxViews or expiresAt
 */
export const isMessageExpired = (message: MessageData): boolean => {
  if (message.maxViews !== null && message.currentViews !== undefined && message.currentViews >= message.maxViews) {
    console.log(`Message with ID ${message.id} expired due to maxViews`);
    return true;
  }
  
  if (message.expiresAt && new Date(message.expiresAt) < new Date()) {
    console.log(`Message with ID ${message.id} expired due to expiresAt`);
    return true;
  }
  
  return false;
};

/**
 * Store the encryption key for the message after creation
 */
const storeMessageKey = (messageId: string): void => {
  // This function is intentionally left empty as the key storing logic
  // is handled directly in the useMessageDecryption hook to ensure
  // the key is stored only after successful decryption.
  console.warn(`storeMessageKey was called for message ID ${messageId} but is intentionally empty`);
};
