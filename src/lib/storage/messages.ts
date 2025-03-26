
import { MessageData } from './types';
import { getAllMessages, getUserId } from './core';
import { removeEncryptionKey, storeEncryptionKey } from './keys';

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
 * Store the encryption key for the message after creation
 */
const storeMessageKey = (messageId: string): void => {
  if (!messageId) return;
  
  try {
    // Try to get the key from the URL hash
    const urlHash = window.location.hash;
    if (urlHash && urlHash.length > 1) {
      const key = urlHash.substring(1);
      storeEncryptionKey(messageId, key);
    }
  } catch (e) {
    console.error("Failed to auto-store key from URL hash", e);
  }
};

/**
 * Saves a message to localStorage with verification
 */
export const saveMessage = (message: MessageData): boolean => {
  try {
    if (!message || !message.id || !message.encryptedContent) {
      console.error("Invalid message object provided to saveMessage");
      return false;
    }
    
    // Add owner ID if user is signed in
    const userId = getUserId();
    if (userId) {
      message.ownerId = userId;
    }
    
    // Log the message being saved for debugging
    console.log(`Saving message with ID: ${message.id}, expires: ${message.expiresAt ? new Date(message.expiresAt).toLocaleString() : 'never'}, maxViews: ${message.maxViews || 'unlimited'}`);
    
    // Make new copy of all existing messages
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
    
    // Store the updated messages - forcing proper JSON with replacer function
    const messagesJson = JSON.stringify(messages, null, 0);
    
    // Make sure we're not storing an empty array string
    if (messagesJson === '[]' && messages.length > 0) {
      console.error("ERROR: Trying to save an empty array string when messages exist!");
      return false;
    }
    
    // CRITICAL: Save to localStorage
    localStorage.setItem('secureMessages', messagesJson);
    
    // Verify the save was successful by reading it back
    const verifyMessagesStr = localStorage.getItem('secureMessages');
    
    // Perform verification checks
    if (!verifyMessagesStr) {
      console.error("ERROR: Failed to save messages to localStorage - value is null!");
      return false;
    }
    
    if (verifyMessagesStr === '[]' && messages.length > 0) {
      console.error("ERROR: After save, localStorage contains empty array when it should have messages!");
      
      // Try one more extreme approach - save directly
      try {
        // Direct single-message save as last resort
        const singleMessageJson = JSON.stringify([message]);
        localStorage.setItem('secureMessages', singleMessageJson);
        console.log("Attempted direct save of single message as fallback");
        
        // Final verification
        const finalCheck = localStorage.getItem('secureMessages');
        if (!finalCheck || finalCheck === '[]') {
          console.error("ERROR: Final attempt to save message failed!");
          return false;
        }
      } catch (e) {
        console.error("ERROR: Failed in final save attempt", e);
        return false;
      }
    }
    
    // Log successful save details
    console.log(`Message ${message.id} saved successfully, storage size: ${verifyMessagesStr.length} chars, total messages: ${messages.length}`);
    
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
    
    // Store the encryption key for future access if one is provided
    storeMessageKey(message.id);
    
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
    
    // Dump the raw localStorage value for debugging
    try {
      const raw = localStorage.getItem('secureMessages');
      console.log(`Raw 'secureMessages' in localStorage: ${raw ? 'found' : 'not found'}, length: ${raw?.length || 0}`);
      
      if (raw && raw.length < 5) {
        console.warn(`'secureMessages' might be corrupted, content: ${raw}`);
      }
      
      if (raw === '[]') {
        console.warn("'secureMessages' is an empty array, no messages found");
      }
    } catch (e) {
      console.error('Error accessing raw localStorage:', e);
    }
    
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
