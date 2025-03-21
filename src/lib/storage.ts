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
    if (!messagesString) return [];
    
    const messages = JSON.parse(messagesString);
    return Array.isArray(messages) ? messages : [];
  } catch (error) {
    console.error('Error getting messages:', error);
    return [];
  }
};

/**
 * Saves a message to localStorage
 */
export const saveMessage = (message: MessageData) => {
  // Add owner ID if user is signed in
  const userId = getUserId();
  if (userId) {
    message.ownerId = userId;
  }
  
  const messages = getAllMessages();
  messages.push(message);
  localStorage.setItem('secureMessages', JSON.stringify(messages));
  
  // If user is signed in, also save to user's messages
  if (userId) {
    const userMessages = getUserMessages();
    userMessages.push(message);
    localStorage.setItem(`userMessages_${userId}`, JSON.stringify(userMessages));
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
  const messages = getAllMessages();
  return messages.find(message => message.id === id);
};

/**
 * Updates a message in localStorage
 */
export const updateMessage = (updatedMessage: MessageData) => {
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
};

/**
 * Deletes a message from localStorage
 */
export const deleteMessage = (id: string) => {
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
  const message = getMessage(id);
  if (message) {
    const updatedMessage: MessageData = {
      ...message,
      currentViews: message.currentViews + 1,
    };
    updateMessage(updatedMessage);
    return updatedMessage;
  }
  return undefined;
};

/**
 * Checks if a message has expired based on maxViews or expiresAt
 */
export const isMessageExpired = (message: MessageData): boolean => {
  if (message.maxViews !== null && message.currentViews >= message.maxViews) {
    return true;
  }
  if (message.expiresAt !== null && Date.now() > message.expiresAt) {
    return true;
  }
  return false;
};

/**
 * Cleans up expired messages from localStorage
 */
export const cleanupExpiredMessages = () => {
  const messages = getAllMessages();
  const validMessages = messages.filter(message => !isMessageExpired(message));
  
  // Delete expired messages
  messages.forEach(message => {
    if (isMessageExpired(message)) {
      deleteMessage(message.id);
    }
  });

  localStorage.setItem('secureMessages', JSON.stringify(validMessages));
};

/**
 * Store encryption key separately to support cross-device access
 * In a production app, this would likely use a more secure storage method
 */
export const storeEncryptionKey = (messageId: string, encodedKey: string) => {
  try {
    // Trim the key to avoid whitespace issues during cross-browser decryption
    const trimmedKey = encodedKey.trim();
    
    const keysStore = localStorage.getItem('secureMessageKeys') || '{}';
    const keys = JSON.parse(keysStore);
    
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
    const keysStore = localStorage.getItem('secureMessageKeys') || '{}';
    const keys = JSON.parse(keysStore);
    
    const key = keys[messageId] || null;
    if (key) {
      console.log(`Retrieved key for message ID: ${messageId}, key length: ${key.length}`);
    }
    return key;
  } catch (error) {
    console.error('Error retrieving encryption key:', error);
    return null;
  }
};
