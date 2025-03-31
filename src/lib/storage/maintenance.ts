import { getAllMessages, getUserId, getUserMessages } from './core';
import { isMessageExpired } from './messages';
import { cleanupOrphanedKeys } from './keys';

/**
 * Cleans up expired messages from localStorage
 */
export const cleanupExpiredMessages = () => {
  try {
    const messages = getAllMessages();
    let deletedCount = 0;
    
    // Early exit if there are no messages to avoid unnecessary work
    if (messages.length === 0) {
      console.log("No messages to clean up");
      return 0;
    }
    
    // Identify and delete expired messages
    messages.forEach(message => {
      if (isMessageExpired(message)) {
        console.log(`Deleting expired message ${message.id}`);
        // We don't directly call deleteMessage here to avoid circular imports
        // Instead we'll filter out expired messages below
        deletedCount++;
      }
    });
    
    console.log(`Cleaning up expired messages: ${deletedCount} expired out of ${messages.length} total`);
    
    // Only filter if we actually found expired messages
    if (deletedCount > 0) {
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
    }
    
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up expired messages:', error);
    return 0;
  }
};

/**
 * Clears all message-related data from localStorage
 * @param preserveUserData If true, preserves user-specific data and valid messages
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
      // Initialize empty array to prevent null issues
      localStorage.setItem('secureMessages', '[]');
      clearedItems++;
    } else {
      console.log("Preserving valid messages, only cleaning expired ones");
      // Only remove expired messages
      try {
        if (messagesStr) {
          messages = JSON.parse(messagesStr);
          if (Array.isArray(messages)) {
            const initialCount = messages.length;
            
            // Early exit if no messages to process
            if (initialCount === 0) {
              console.log("No messages to clean up");
              return 0;
            }
            
            const validMessages = messages.filter(message => !isMessageExpired(message));
            
            // Only update storage if we actually removed something
            if (validMessages.length < initialCount) {
              // Make sure we're not saving an empty array when we have valid messages
              if (validMessages.length > 0) {
                localStorage.setItem('secureMessages', JSON.stringify(validMessages));
              } else {
                localStorage.setItem('secureMessages', '[]');
              }
              
              clearedItems += (initialCount - validMessages.length);
              console.log(`Removed ${initialCount - validMessages.length} expired messages, ${validMessages.length} remaining`);
            } else {
              console.log(`No expired messages found among ${initialCount} messages`);
            }
          } else {
            // Initialize empty array if content is not an array
            localStorage.setItem('secureMessages', '[]');
            console.log("Initialized empty messages array (content was not an array)");
          }
        } else {
          // Initialize empty array if no messages exist
          localStorage.setItem('secureMessages', '[]');
          console.log("Initialized empty messages array (no messages existed)");
        }
      } catch (e) {
        console.error("Error cleaning up expired messages:", e);
        // Reset the storage if there's corruption
        localStorage.setItem('secureMessages', '[]');
        clearedItems++;
      }
    }
    
    // Don't clear encryption keys by default - this was causing lost data
    if (!preserveUserData) {
      localStorage.removeItem('secureMessageKeys');
      clearedItems++;
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
    } else {
      console.log("Skipping periodic cleanup, last cleanup was recent");
    }
    
    // Check if 'secureMessages' exists and initialize if not
    const messagesStr = localStorage.getItem('secureMessages');
    if (!messagesStr) {
      localStorage.setItem('secureMessages', '[]');
      console.log("Initialized empty secureMessages array during cleanup");
    } else if (messagesStr === '[]') {
      console.log("secureMessages exists but is empty array");
    } else {
      try {
        const parsedMessages = JSON.parse(messagesStr);
        if (Array.isArray(parsedMessages)) {
          console.log(`secureMessages contains ${parsedMessages.length} messages`);
        } else {
          console.warn("secureMessages does not contain an array, resetting");
          localStorage.setItem('secureMessages', '[]');
        }
      } catch (e) {
        console.warn("Error parsing secureMessages, resetting to empty array");
        localStorage.setItem('secureMessages', '[]');
      }
    }
  } catch (error) {
    console.error('Error in periodic cache cleanup:', error);
  }
};
