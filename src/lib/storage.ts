
export interface MessageData {
  id: string;
  encryptedContent: string;
  expiresAt: number | null;
  maxViews: number | null;
  currentViews: number;
  createdAt: number;
  sharedWithUsers?: string[]; // Array of user IDs the message is shared with
  ownerId?: string; // ID of the user who created the message
}

/**
 * Gets all messages from localStorage
 */
const getAllMessages = (): MessageData[] => {
  try {
    const messagesString = localStorage.getItem('secureMessages');
    if (!messagesString) {
      console.log("No 'secureMessages' found in localStorage");
      return [];
    }
    
    const messages = JSON.parse(messagesString);
    if (!Array.isArray(messages)) {
      console.warn("'secureMessages' is not an array, resetting to empty array");
      localStorage.setItem('secureMessages', '[]');
      return [];
    }
    
    return messages;
  } catch (error) {
    console.error('Error getting messages:', error);
    // Reset the storage if there's corruption
    localStorage.setItem('secureMessages', '[]');
    return [];
  }
};

/**
 * Saves a message to localStorage
 */
export const saveMessage = (message: MessageData) => {
  try {
    // Add owner ID if user is signed in
    const userId = getUserId();
    if (userId) {
      message.ownerId = userId;
    }
    
    // Log the message being saved for debugging
    console.log(`Saving message with ID: ${message.id}, expires: ${message.expiresAt ? new Date(message.expiresAt).toLocaleString() : 'never'}, maxViews: ${message.maxViews || 'unlimited'}`);
    
    const messages = getAllMessages();
    
    // Check if message with this ID already exists and update it instead
    const existingIndex = messages.findIndex(m => m.id === message.id);
    if (existingIndex >= 0) {
      messages[existingIndex] = message;
      console.log(`Updated existing message ${message.id}`);
    } else {
      messages.push(message);
      console.log(`Added new message ${message.id}`);
    }
    
    // Store the updated messages
    const messagesJson = JSON.stringify(messages);
    localStorage.setItem('secureMessages', messagesJson);
    console.log(`Message ${message.id} saved successfully, storage size: ${messagesJson.length} chars`);
    
    // If user is signed in, also save to user's messages
    if (userId) {
      const userMessages = getUserMessages();
      const userExistingIndex = userMessages.findIndex(m => m.id === message.id);
      if (userExistingIndex >= 0) {
        userMessages[userExistingIndex] = message;
      } else {
        userMessages.push(message);
      }
      localStorage.setItem(`userMessages_${userId}`, JSON.stringify(userMessages));
    }
    
    return true;
  } catch (error) {
    console.error('Error saving message:', error);
    return false;
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
 * Retrieves a message by ID from localStorage
 */
export const getMessage = (id: string): MessageData | undefined => {
  try {
    if (!id) {
      console.error("getMessage: No ID provided");
      return undefined;
    }
    
    // Log all available message IDs for debugging
    const allMessages = getAllMessages();
    console.log(`Looking for message ID: ${id}`);
    console.log(`Available message IDs: ${allMessages.map(m => m.id).join(', ')}`);
    
    // Try all possible places where the message could be stored
    
    // 1. First check in global storage
    const messages = getAllMessages();
    const message = messages.find(message => message.id === id);
    
    if (message) {
      console.log(`Message ${id} found in global storage`);
      return message;
    }
    
    // 2. Check user-specific storage
    const userId = getUserId();
    if (userId) {
      const userMessages = getUserMessages();
      const userMessage = userMessages.find(message => message.id === id);
      if (userMessage) {
        console.log(`Message ${id} found in user-specific storage`);
        return userMessage;
      }
    }
    
    // 3. Try to look for partial ID matches (for cross-browser compatibility)
    // Some browsers might truncate long IDs in localStorage
    const partialMatches = messages.filter(message => 
      id.includes(message.id) || message.id.includes(id)
    );
    
    if (partialMatches.length === 1) {
      console.log(`Message ${id} found via partial ID match: ${partialMatches[0].id}`);
      return partialMatches[0];
    } else if (partialMatches.length > 1) {
      console.warn(`Multiple partial matches found for ID ${id}, using most recent`);
      // Sort by creation date (newest first) and use the most recent
      const sorted = [...partialMatches].sort((a, b) => b.createdAt - a.createdAt);
      return sorted[0];
    }
    
    console.warn(`Message ${id} not found in any storage`);
    return undefined;
  } catch (error) {
    console.error(`Error retrieving message ${id}:`, error);
    return undefined;
  }
};

/**
 * Updates a message in localStorage
 */
export const updateMessage = (updatedMessage: MessageData) => {
  try {
    console.log(`Updating message ${updatedMessage.id}, views: ${updatedMessage.currentViews}/${updatedMessage.maxViews || 'unlimited'}`);
    
    const messages = getAllMessages();
    const updatedMessages = messages.map(message =>
      message.id === updatedMessage.id ? updatedMessage : message
    );
    localStorage.setItem('secureMessages', JSON.stringify(updatedMessages));
    
    // If user is signed in, also update in user's messages
    const userId = getUserId();
    if (userId) {
      const userMessages = getUserMessages();
      const updatedUserMessages = userMessages.map(message =>
        message.id === updatedMessage.id ? updatedMessage : message
      );
      localStorage.setItem(`userMessages_${userId}`, JSON.stringify(updatedUserMessages));
    }
    
    return true;
  } catch (error) {
    console.error(`Error updating message ${updatedMessage.id}:`, error);
    return false;
  }
};

/**
 * Deletes a message from localStorage
 */
export const deleteMessage = (id: string) => {
  try {
    console.log(`Deleting message ${id}`);
    
    const messages = getAllMessages();
    const updatedMessages = messages.filter(message => message.id !== id);
    localStorage.setItem('secureMessages', JSON.stringify(updatedMessages));
    
    // If user is signed in, also delete from user's messages
    const userId = getUserId();
    if (userId) {
      const userMessages = getUserMessages();
      const updatedUserMessages = userMessages.filter(message => message.id !== id);
      localStorage.setItem(`userMessages_${userId}`, JSON.stringify(updatedUserMessages));
    }
    
    // Also remove any stored keys
    removeEncryptionKey(id);
    
    return true;
  } catch (error) {
    console.error(`Error deleting message ${id}:`, error);
    return false;
  }
};

/**
 * Share a message with a specific user
 */
export const shareMessageWithUser = (messageId: string, userId: string) => {
  const message = getMessage(messageId);
  if (!message) return false;
  
  // Add user to shared list if not already there
  if (!message.sharedWithUsers) {
    message.sharedWithUsers = [];
  }
  
  if (!message.sharedWithUsers.includes(userId)) {
    message.sharedWithUsers.push(userId);
    updateMessage(message);
  }
  
  return true;
};

/**
 * Get messages shared with the current user
 */
export const getSharedMessages = (): MessageData[] => {
  const userId = getUserId();
  if (!userId) return [];
  
  const allMessages = getAllMessages();
  return allMessages.filter(
    message => message.sharedWithUsers?.includes(userId) && message.ownerId !== userId
  );
};

/**
 * Increments the view count of a message and returns the updated message
 */
export const incrementMessageViews = (id: string): MessageData | undefined => {
  try {
    const message = getMessage(id);
    if (message) {
      const updatedMessage: MessageData = {
        ...message,
        currentViews: message.currentViews + 1,
      };
      
      console.log(`Incrementing views for message ${id}: ${message.currentViews} -> ${updatedMessage.currentViews}`);
      
      // Check if this view should expire the message
      if (updatedMessage.maxViews !== null && updatedMessage.currentViews >= updatedMessage.maxViews) {
        console.log(`Message ${id} has reached max views (${updatedMessage.maxViews}), will be marked for deletion`);
      }
      
      const success = updateMessage(updatedMessage);
      
      if (success) {
        console.log(`Successfully updated view count for message ${id}`);
        return updatedMessage;
      } else {
        console.error(`Failed to update view count for message ${id}`);
        return message;
      }
    }
    return undefined;
  } catch (error) {
    console.error(`Error incrementing views for message ${id}:`, error);
    return undefined;
  }
};

/**
 * Checks if a message has expired based on maxViews or expiresAt
 */
export const isMessageExpired = (message: MessageData): boolean => {
  // Check view limit
  if (message.maxViews !== null && message.currentViews >= message.maxViews) {
    console.log(`Message ${message.id} expired due to view limit: ${message.currentViews}/${message.maxViews}`);
    return true;
  }
  
  // Check time expiration
  if (message.expiresAt !== null && Date.now() > message.expiresAt) {
    console.log(`Message ${message.id} expired due to time: ${new Date(message.expiresAt).toLocaleString()}`);
    return true;
  }
  
  return false;
};

/**
 * Cleans up expired messages from localStorage
 */
export const cleanupExpiredMessages = () => {
  try {
    const messages = getAllMessages();
    let deletedCount = 0;
    
    // Identify and delete expired messages
    messages.forEach(message => {
      if (isMessageExpired(message)) {
        console.log(`Deleting expired message ${message.id}`);
        deleteMessage(message.id);
        deletedCount++;
      }
    });
    
    console.log(`Cleaning up expired messages: ${deletedCount} expired out of ${messages.length} total`);
    
    // Filter out expired messages from global storage
    const validMessages = messages.filter(message => !isMessageExpired(message));
    localStorage.setItem('secureMessages', JSON.stringify(validMessages));
    
    // Also clean up user-specific storage
    const userId = getUserId();
    if (userId) {
      const userMessages = getUserMessages();
      const validUserMessages = userMessages.filter(message => !isMessageExpired(message));
      localStorage.setItem(`userMessages_${userId}`, JSON.stringify(validUserMessages));
    }
    
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up expired messages:', error);
    return 0;
  }
};

/**
 * Store encryption key separately to support cross-device access
 */
export const storeEncryptionKey = (messageId: string, encodedKey: string) => {
  try {
    if (!messageId || !encodedKey) {
      console.error("Cannot store key: missing messageId or key");
      return false;
    }
    
    // Trim the key to avoid whitespace issues 
    const trimmedKey = encodedKey.trim();
    
    const keysStore = localStorage.getItem('secureMessageKeys') || '{}';
    let keys = {};
    
    try {
      keys = JSON.parse(keysStore);
    } catch (e) {
      console.error("Error parsing keys store, resetting:", e);
      keys = {};
    }
    
    keys[messageId] = trimmedKey;
    localStorage.setItem('secureMessageKeys', JSON.stringify(keys));
    
    console.log(`Key stored for message ID: ${messageId}, key length: ${trimmedKey.length}`);
    return true;
  } catch (error) {
    console.error('Error storing encryption key:', error);
    return false;
  }
};

/**
 * Retrieve an encryption key for a message
 */
export const getEncryptionKey = (messageId: string): string | null => {
  try {
    if (!messageId) {
      console.error("Cannot retrieve key: missing messageId");
      return null;
    }
    
    console.log(`Looking for encryption key for message: ${messageId}`);
    
    const keysStore = localStorage.getItem('secureMessageKeys') || '{}';
    let keys = {};
    
    try {
      keys = JSON.parse(keysStore);
    } catch (e) {
      console.error("Error parsing keys store:", e);
      return null;
    }
    
    // Check for exact match
    const key = keys[messageId] || null;
    
    if (key) {
      console.log(`Retrieved key for message ID: ${messageId}, key length: ${key.length}`);
      return key;
    }
    
    // If no exact match, try partial matching for cross-browser compatibility
    const possibleMatches = Object.keys(keys).filter(
      id => id.includes(messageId) || messageId.includes(id)
    );
    
    if (possibleMatches.length === 1) {
      const matchedKey = keys[possibleMatches[0]];
      console.log(`Found key via partial ID match: ${possibleMatches[0]}, key length: ${matchedKey.length}`);
      return matchedKey;
    } else if (possibleMatches.length > 1) {
      console.warn(`Multiple potential key matches for ID ${messageId}: ${possibleMatches.join(', ')}`);
      // Use the first match as a fallback
      return keys[possibleMatches[0]];
    }
    
    console.warn(`No key found for message ID: ${messageId}`);
    console.log(`Available key IDs: ${Object.keys(keys).join(', ')}`);
    return null;
  } catch (error) {
    console.error('Error retrieving encryption key:', error);
    return null;
  }
};

/**
 * Remove an encryption key from storage
 */
export const removeEncryptionKey = (messageId: string): boolean => {
  try {
    if (!messageId) {
      return false;
    }
    
    const keysStore = localStorage.getItem('secureMessageKeys') || '{}';
    let keys = {};
    
    try {
      keys = JSON.parse(keysStore);
    } catch (e) {
      return false;
    }
    
    // Remove the key
    if (keys[messageId]) {
      delete keys[messageId];
      localStorage.setItem('secureMessageKeys', JSON.stringify(keys));
      console.log(`Removed encryption key for message ID: ${messageId}`);
      return true;
    }
    
    // Also check for partial matches
    const possibleMatches = Object.keys(keys).filter(
      id => id.includes(messageId) || messageId.includes(id)
    );
    
    if (possibleMatches.length > 0) {
      possibleMatches.forEach(id => {
        delete keys[id];
      });
      localStorage.setItem('secureMessageKeys', JSON.stringify(keys));
      console.log(`Removed ${possibleMatches.length} encryption key(s) for partial matches to ID: ${messageId}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error removing encryption key:', error);
    return false;
  }
};

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
