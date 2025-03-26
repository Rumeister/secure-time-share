import { getAllMessages } from './core';

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
