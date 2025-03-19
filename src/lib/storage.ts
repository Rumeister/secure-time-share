
/**
 * Local storage utility for encrypted messages
 */

export interface EncryptedMessage {
  id: string;
  encryptedContent: string;
  expiresAt: number | null; // Unix timestamp in milliseconds
  maxViews: number | null;
  currentViews: number;
  createdAt: number; // Unix timestamp in milliseconds
}

const STORAGE_KEY = "secure_messages";

// Get all stored messages
export const getStoredMessages = (): EncryptedMessage[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error("Error parsing stored messages:", error);
    return [];
  }
};

// Get a specific message by ID
export const getMessageById = (id: string): EncryptedMessage | null => {
  const messages = getStoredMessages();
  const message = messages.find(msg => msg.id === id);
  return message || null;
};

// Save a message to storage
export const saveMessage = (message: EncryptedMessage): void => {
  const messages = getStoredMessages();
  messages.push(message);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
};

// Update a message in storage
export const updateMessage = (updatedMessage: EncryptedMessage): void => {
  const messages = getStoredMessages();
  const index = messages.findIndex(msg => msg.id === updatedMessage.id);
  
  if (index !== -1) {
    messages[index] = updatedMessage;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }
};

// Delete a message from storage
export const deleteMessage = (id: string): void => {
  const messages = getStoredMessages();
  const updatedMessages = messages.filter(msg => msg.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMessages));
};

// Check if a message is expired
export const isMessageExpired = (message: EncryptedMessage): boolean => {
  // Check time expiration
  if (message.expiresAt && Date.now() > message.expiresAt) {
    return true;
  }
  
  // Check view count expiration
  if (message.maxViews !== null && message.currentViews >= message.maxViews) {
    return true;
  }
  
  return false;
};

// Clean up expired messages
export const cleanupExpiredMessages = (): void => {
  const messages = getStoredMessages();
  const validMessages = messages.filter(msg => !isMessageExpired(msg));
  
  if (validMessages.length !== messages.length) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validMessages));
  }
};

// Increment view count for a message
export const incrementMessageViews = (id: string): EncryptedMessage | null => {
  const message = getMessageById(id);
  if (!message) return null;
  
  const updatedMessage = {
    ...message,
    currentViews: message.currentViews + 1,
  };
  
  updateMessage(updatedMessage);
  return updatedMessage;
};
