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
    
    // Clean the ID - trim whitespace
    const cleanId = id.trim();
    console.log(`Looking for message with ID: ${cleanId}`);
    
    // Get all messages for debugging
    const allMessages = getAllMessages();
    console.log(`Found ${allMessages.length} messages in localStorage`);
    
    if (allMessages.length > 0) {
      console.log(`Available message IDs: ${allMessages.map(m => m.id).join(', ')}`);
    }
    
    // 1. First try exact match
    const exactMatch = allMessages.find(message => message.id === cleanId);
    if (exactMatch) {
      console.log(`Found exact match for message ID: ${cleanId}`);
      return exactMatch;
    }
    
    // 2. Try case-insensitive match (cross-browser issue where case might be different)
    const caseInsensitiveMatch = allMessages.find(
      message => message.id.toLowerCase() === cleanId.toLowerCase()
    );
    if (caseInsensitiveMatch) {
      console.log(`Found case-insensitive match for message ID: ${cleanId}`);
      return caseInsensitiveMatch;
    }
    
    // 3. Check for partial ID matches (major cross-browser compatibility)
    console.log("Checking for partial ID matches...");
    
    // Sort potential partial matches by confidence level
    // Confidence is based on:
    // a) Length of matching substring
    // b) Position of match (a match at beginning is stronger)
    
    const partialMatches = allMessages
      .map(message => {
        // Get the longest matching substring
        let longestMatch = 0;
        
        // Check if one is a substring of the other
        if (message.id.includes(cleanId)) {
          longestMatch = cleanId.length;
        } else if (cleanId.includes(message.id)) {
          longestMatch = message.id.length;
        } else {
          // Try to find common substring (minimum 10 chars to be significant)
          for (let i = 0; i < message.id.length - 10; i++) {
            for (let len = 10; len <= message.id.length - i; len++) {
              const substr = message.id.substring(i, i + len);
              if (cleanId.includes(substr) && len > longestMatch) {
                longestMatch = len;
              }
            }
          }
        }
        
        // Calculate percentage match (prioritize beginning of string matches)
        const beginningMatch = message.id.startsWith(cleanId.substring(0, 10)) || 
                             cleanId.startsWith(message.id.substring(0, 10));
        
        const confidence = longestMatch + (beginningMatch ? 10 : 0);
        
        return { 
          message, 
          confidence,
          longestMatch
        };
      })
      .filter(match => match.longestMatch >= 10) // Only consider significant matches
      .sort((a, b) => b.confidence - a.confidence); // Sort by confidence
    
    if (partialMatches.length > 0) {
      const bestMatch = partialMatches[0];
      console.log(`Found partial ID match with confidence ${bestMatch.confidence}, matching ${bestMatch.longestMatch} characters`);
      console.log(`Best match ID: ${bestMatch.message.id}`);
      return bestMatch.message;
    }
    
    // 4. Check if the ID was truncated (some browsers may truncate long IDs)
    const truncatedMatches = allMessages.filter(message => 
      message.id.startsWith(cleanId.substring(0, 20)) || 
      cleanId.startsWith(message.id.substring(0, 20))
    );
    
    if (truncatedMatches.length === 1) {
      console.log(`Found possible truncated ID match: ${truncatedMatches[0].id}`);
      return truncatedMatches[0];
    } else if (truncatedMatches.length > 1) {
      // If multiple matches, sort by creation date and use most recent
      const sorted = [...truncatedMatches].sort((a, b) => b.createdAt - a.createdAt);
      console.log(`Multiple truncated matches found, using most recent: ${sorted[0].id}`);
      return sorted[0];
    }
    
    console.log(`Message ${cleanId} not found in storage`);
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
      // Check if this message is already at max views and should be deleted
      if (message.maxViews !== null && message.currentViews >= message.maxViews) {
        console.log(`Message ${id} has already reached max views (${message.maxViews}), skipping increment`);
        return message;
      }
      
      const updatedMessage: MessageData = {
        ...message,
        currentViews: message.currentViews + 1,
      };
      
      console.log(`Incrementing views for message ${id}: ${message.currentViews} -> ${updatedMessage.currentViews}`);
      
      // Check if this view should expire the message
      if (updatedMessage.maxViews !== null && updatedMessage.currentViews >= updatedMessage.maxViews) {
        console.log(`Message ${id} has reached max views (${updatedMessage.maxViews}), will be marked for deletion after view`);
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
    
    // Clean the ID and key
    const cleanId = messageId.trim();
    const trimmedKey = encodedKey.trim();
    
    console.log(`Storing key for message ID: ${cleanId}, key length: ${trimmedKey.length}`);
    
    const keysStore = localStorage.getItem('secureMessageKeys') || '{}';
    let keys = {};
    
    try {
      keys = JSON.parse(keysStore);
    } catch (e) {
      console.error("Error parsing keys store, resetting:", e);
      keys = {};
    }
    
    // Store the key against the ID
    keys[cleanId] = trimmedKey;
    
    // Also store using a shorter version of the ID (first 20 chars)
    // This helps with cross-browser compatibility where IDs might get truncated
    const shortId = cleanId.substring(0, 20);
    if (shortId !== cleanId) {
      keys[shortId] = trimmedKey;
      console.log(`Also storing key under shortened ID: ${shortId}`);
    }
    
    localStorage.setItem('secureMessageKeys', JSON.stringify(keys));
    console.log(`Key stored successfully for message ID: ${cleanId}`);
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
    
    // Clean the ID
    const cleanId = messageId.trim();
    console.log(`Looking for encryption key for message: ${cleanId}`);
    
    const keysStore = localStorage.getItem('secureMessageKeys') || '{}';
    let keys = {};
    
    try {
      keys = JSON.parse(keysStore);
    } catch (e) {
      console.error("Error parsing keys store:", e);
      return null;
    }
    
    // Log keys for debugging
    const keyIds = Object.keys(keys);
    console.log(`Found ${keyIds.length} stored keys`);
    if (keyIds.length > 0) {
      console.log(`Available key IDs: ${keyIds.join(', ')}`);
    }
    
    // Check for exact match
    const key = keys[cleanId];
    if (key) {
      console.log(`Retrieved key for exact message ID match: ${cleanId}, key length: ${key.length}`);
      return key;
    }
    
    // Check for case-insensitive match
    const caseInsensitiveKeyId = keyIds.find(
      id => id.toLowerCase() === cleanId.toLowerCase()
    );
    if (caseInsensitiveKeyId) {
      const ciKey = keys[caseInsensitiveKeyId];
      console.log(`Retrieved key for case-insensitive ID match: ${caseInsensitiveKeyId}, key length: ${ciKey.length}`);
      return ciKey;
    }
    
    // Check for shortened ID (first 20 chars)
    const shortId = cleanId.substring(0, 20);
    const shortKey = keys[shortId];
    if (shortKey) {
      console.log(`Retrieved key for shortened ID: ${shortId}, key length: ${shortKey.length}`);
      return shortKey;
    }
    
    // Check for partial matches - using the same algorithm as getMessage
    const partialMatchIds = keyIds.filter(id => {
      // Look for significant substring matches
      if (id.includes(cleanId) || cleanId.includes(id)) {
        return true;
      }
      
      // Check for common substrings of significant length
      for (let i = 0; i < id.length - 10; i++) {
        for (let len = 10; len <= id.length - i; len++) {
          const substr = id.substring(i, i + len);
          if (cleanId.includes(substr)) {
            return true;
          }
        }
      }
      return false;
    });
    
    if (partialMatchIds.length === 1) {
      const matchedKey = keys[partialMatchIds[0]];
      console.log(`Retrieved key via partial ID match: ${partialMatchIds[0]}, key length: ${matchedKey.length}`);
      return matchedKey;
    } else if (partialMatchIds.length > 1) {
      console.log(`Multiple potential key matches for ID ${cleanId}: ${partialMatchIds.join(', ')}`);
      
      // Get the most promising match (longest ID match with actual message)
      const messages = getAllMessages();
      const messageIds = messages.map(m => m.id);
      
      // Find partial match IDs that correspond to actual messages
      const existingMessageMatches = partialMatchIds.filter(id => 
        messageIds.some(mid => mid.includes(id) || id.includes(mid))
      );
      
      if (existingMessageMatches.length === 1) {
        const matchedKey = keys[existingMessageMatches[0]];
        console.log(`Found single key match that corresponds to existing message: ${existingMessageMatches[0]}`);
        return matchedKey;
      } else if (existingMessageMatches.length > 0) {
        // Use the first match
        const matchedKey = keys[existingMessageMatches[0]];
        console.log(`Using first of multiple key matches: ${existingMessageMatches[0]}`);
        return matchedKey;
      } else {
        // No matches correspond to messages, just use the first one
        const matchedKey = keys[partialMatchIds[0]];
        console.log(`No key matches correspond to messages, using first match: ${partialMatchIds[0]}`);
        return matchedKey;
      }
    }
    
    console.log(`No key found for message ID: ${cleanId}`);
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

/**
 * Clears all message-related data from localStorage
 * @param preserveUserData If true, preserves user-specific data
 * @returns The number of items cleared
 */
export const clearMessageCache = (preserveUserData: boolean = true): number => {
  try {
    let clearedItems = 0;
    
    // Get the current messages from storage
    const messagesStr = localStorage.getItem('secureMessages');
    let messages = [];
    
    // If preserveUserData is false, clear all messages
    if (!preserveUserData) {
      console.log("Clearing all messages from localStorage");
      localStorage.removeItem('secureMessages');
      clearedItems++;
    } else {
      console.log("Preserving valid messages, only cleaning expired ones");
      // Only remove expired messages
      try {
        if (messagesStr) {
          messages = JSON.parse(messagesStr);
          if (Array.isArray(messages)) {
            const initialCount = messages.length;
            const validMessages = messages.filter(message => !isMessageExpired(message));
            if (validMessages.length < initialCount) {
              localStorage.setItem('secureMessages', JSON.stringify(validMessages));
              clearedItems += (initialCount - validMessages.length);
              console.log(`Removed ${initialCount - validMessages.length} expired messages`);
            }
          }
        }
      } catch (e) {
        console.error("Error cleaning up expired messages:", e);
        // Reset the storage if there's corruption
        localStorage.setItem('secureMessages', '[]');
        clearedItems++;
      }
    }
    
    // Clear encryption keys, but only if we're not preserving user data
    // or if we're getting rid of all messages
    if (!preserveUserData) {
      localStorage.removeItem('secureMessageKeys');
      clearedItems++;
    } else {
      // Clean up orphaned keys (keys without corresponding messages)
      cleanupOrphanedKeys();
    }
    
    // If we're not preserving user data, clear user-specific message storage
    if (!preserveUserData) {
      const userId = getUserId();
      if (userId) {
        localStorage.removeItem(`userMessages_${userId}`);
        clearedItems++;
      }
      
      // Find and remove any legacy user message storage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('userMessages_')) {
          localStorage.removeItem(key);
          clearedItems++;
        }
      }
    }
    
    console.log(`Cleared ${clearedItems} message cache items from localStorage`);
    return clearedItems;
  } catch (error) {
    console.error('Error clearing message cache:', error);
    return 0;
  }
};

/**
 * Periodically cleans up the localStorage to prevent bloat
 * Called automatically on a schedule and on app startup
 */
export const performPeriodicCacheCleanup = (): void => {
  try {
    const lastCleanupTime = localStorage.getItem('lastCacheCleanup');
    const currentTime = Date.now();
    
    // Check if we need to do a cleanup (daily)
    if (!lastCleanupTime || (currentTime - parseInt(lastCleanupTime)) > 86400000) {
      console.log('Performing periodic cache cleanup...');
      
      // Clean up expired messages
      const expiredCount = cleanupExpiredMessages();
      
      // Clean up orphaned keys (keys without corresponding messages)
      const orphanedKeyCount = cleanupOrphanedKeys();
      
      // Update cleanup timestamp
      localStorage.setItem('lastCacheCleanup', currentTime.toString());
      
      console.log(`Periodic cleanup complete. Removed ${expiredCount} expired messages and ${orphanedKeyCount} orphaned keys.`);
    }
  } catch (error) {
    console.error('Error in periodic cache cleanup:', error);
  }
};

/**
 * Cleans up encryption keys that don't have corresponding messages
 */
export const cleanupOrphanedKeys = (): number => {
  try {
    const messages = getAllMessages();
    const messageIds = messages.map(m => m.id);
    
    // Get all keys
    const keysStore = localStorage.getItem('secureMessageKeys') || '{}';
    let keys = {};
    
    try {
      keys = JSON.parse(keysStore);
    } catch (e) {
      console.error("Error parsing keys store:", e);
      return 0;
    }
    
    const keyIds = Object.keys(keys);
    let removedCount = 0;
    
    // Find keys that don't have a corresponding message
    const orphanedKeys = keyIds.filter(keyId => {
      // Keep keys that have a corresponding message
      return !messageIds.some(msgId => 
        msgId === keyId || 
        msgId.includes(keyId) || 
        keyId.includes(msgId)
      );
    });
    
    // Remove orphaned keys
    if (orphanedKeys.length > 0) {
      orphanedKeys.forEach(keyId => {
        delete keys[keyId];
        removedCount++;
      });
      
      localStorage.setItem('secureMessageKeys', JSON.stringify(keys));
      console.log(`Removed ${removedCount} orphaned encryption keys`);
    }
    
    return removedCount;
  } catch (error) {
    console.error('Error cleaning up orphaned keys:', error);
    return 0;
  }
};
