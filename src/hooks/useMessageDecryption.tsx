
import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { decryptMessage, importKey } from "@/lib/encryption";
import { 
  getMessage, 
  incrementMessageViews, 
  isMessageExpired, 
  deleteMessage, 
  getEncryptionKey, 
  getStorageStats 
} from "@/lib/storage";
import { toast } from "sonner";

interface UseMessageDecryptionResult {
  decryptedMessage: string | null;
  loading: boolean;
  error: string | null;
  expiryInfo: string | null;
  debugInfo: string[];
}

export const useMessageDecryption = (id: string | undefined): UseMessageDecryptionResult => {
  const { isSignedIn, user } = useUser();
  const [decryptedMessage, setDecryptedMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expiryInfo, setExpiryInfo] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  
  // Debug log function with log level
  const addDebugInfo = (message: string, level: 'info' | 'warning' | 'error' | 'success' = 'info') => {
    const prefix = level === 'error' ? 'ERROR: ' : 
                   level === 'warning' ? 'WARNING: ' : 
                   level === 'success' ? 'SUCCESS: ' : 'INFO: ';
    setDebugInfo(prev => [...prev, `${prefix}${message}`]);
    console.log(`${level.toUpperCase()}:`, message);
  };
  
  useEffect(() => {
    const decryptAndViewMessage = async () => {
      if (!id) {
        setError("Invalid message ID");
        addDebugInfo("No message ID provided in URL", 'error');
        setLoading(false);
        return;
      }
      
      try {
        // Trim the ID to prevent whitespace issues
        const cleanId = id.trim();
        addDebugInfo(`Starting decryption process for message ID: ${cleanId}`);
        
        // Show storage stats for debugging
        const stats = getStorageStats();
        addDebugInfo(`Storage contains ${stats.messages} messages and ${stats.keys} encryption keys`);
        
        // Get encrypted message from storage
        const message = getMessage(cleanId);
        
        if (!message) {
          setError("Message not found. It may have been deleted or expired.");
          addDebugInfo(`Message with ID ${cleanId} not found in storage`, 'error');
          
          // Enhanced debugging - check localStorage directly
          addDebugInfo("Checking localStorage directly...");
          const lsKeys = [];
          for (let i = 0; i < localStorage.length; i++) {
            lsKeys.push(localStorage.key(i));
          }
          addDebugInfo(`All localStorage keys: ${lsKeys.join(', ')}`);
          
          const secureMessages = localStorage.getItem('secureMessages');
          if (!secureMessages) {
            addDebugInfo("'secureMessages' key not found in localStorage", 'error');
          } else if (secureMessages === '[]') {
            addDebugInfo("'secureMessages' is empty array", 'warning');
          } else {
            addDebugInfo(`'secureMessages' exists and has content (length: ${secureMessages.length})`);
            
            try {
              const parsedMessages = JSON.parse(secureMessages);
              if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
                addDebugInfo(`Available message IDs: ${parsedMessages.map((m: any) => m.id).join(', ')}`);
                
                // Look for ID similarities
                parsedMessages.forEach((m: any) => {
                  // Check if IDs share significant portions
                  const sharedStart = getCommonPrefix(m.id, cleanId);
                  if (sharedStart.length >= 10) {
                    addDebugInfo(`Message ID ${m.id} shares prefix of length ${sharedStart.length} with requested ID`);
                  }
                  
                  if (m.id.includes(cleanId.substring(0, 15))) {
                    addDebugInfo(`Message ID ${m.id} contains the beginning of the requested ID`);
                  }
                  
                  if (cleanId.includes(m.id.substring(0, 15))) {
                    addDebugInfo(`Requested ID contains the beginning of message ID ${m.id}`);
                  }
                });
              }
            } catch (e) {
              addDebugInfo(`Error parsing messages JSON: ${e instanceof Error ? e.message : String(e)}`, 'error');
            }
          }
          
          setLoading(false);
          return;
        }
        
        addDebugInfo(`Message found in storage, ID: ${message.id}`, 'success');
        addDebugInfo(`Message created at: ${new Date(message.createdAt).toLocaleString()}`);
        addDebugInfo(`Message properties: maxViews=${message.maxViews}, currentViews=${message.currentViews}, expiresAt=${message.expiresAt ? new Date(message.expiresAt).toLocaleString() : 'never'}`);
        
        // Check if message is expired
        if (isMessageExpired(message)) {
          deleteMessage(cleanId);
          setError("This message has expired and is no longer available.");
          addDebugInfo("Message has expired and was deleted", 'error');
          setLoading(false);
          return;
        }
        
        // Try multiple ways to get the decryption key
        let keyFragment = window.location.hash.substring(1);
        
        addDebugInfo(`URL fragment present: ${keyFragment ? 'Yes' : 'No'}`);
        
        // If no key in URL, check if the user is the owner or a shared recipient
        if (!keyFragment) {
          if (isSignedIn) {
            addDebugInfo(`User is signed in as: ${user?.primaryEmailAddress?.emailAddress || user?.id}`);
            
            // Check if user created this message and has saved the key
            const storedKey = getEncryptionKey(message.id);
            if (storedKey) {
              addDebugInfo("Found stored encryption key for this message", 'success');
              keyFragment = storedKey;
            } 
            // Check if this message was shared with the current user
            else if (message.sharedWithUsers?.includes(user?.id || "") || message.ownerId === user?.id) {
              addDebugInfo(`Message ownership: ${message.ownerId === user?.id ? 'User is owner' : 'Message shared with user'}`);
              // Try to get the key again (added redundancy)
              const storedSharedKey = getEncryptionKey(message.id);
              if (storedSharedKey) {
                keyFragment = storedSharedKey;
                addDebugInfo("Retrieved shared encryption key", 'success');
              } else {
                addDebugInfo("User has access to this message but no encryption key found", 'warning');
              }
            } else {
              addDebugInfo("User is signed in but has no relation to this message", 'warning');
            }
          } else {
            addDebugInfo("User is not signed in, can only decrypt with URL fragment", 'info');
          }
        }
        
        if (!keyFragment) {
          setError("Missing decryption key. The URL may be incomplete or you don't have access to this message.");
          addDebugInfo("No decryption key found in URL hash or stored keys", 'error');
          setLoading(false);
          return;
        }
        
        // Clean the key fragment - remove any leading/trailing whitespace
        keyFragment = keyFragment.trim();
        
        addDebugInfo(`Key fragment found, length: ${keyFragment.length}`);
        
        try {
          // Import the key
          addDebugInfo("Attempting to import key...");
          const key = await importKey(keyFragment);
          addDebugInfo("Key imported successfully", 'success');
          
          // Decrypt the message
          addDebugInfo("Attempting to decrypt message...");
          const decrypted = await decryptMessage(message.encryptedContent, key);
          
          // Validate the decrypted content
          if (!decrypted || decrypted.length === 0) {
            throw new Error("Decryption resulted in empty content");
          }
          
          addDebugInfo(`Message decrypted successfully, length: ${decrypted.length}`, 'success');
          
          // Update view count AFTER successful decryption
          const updatedMessage = incrementMessageViews(message.id);
          
          if (updatedMessage) {
            addDebugInfo(`View count incremented: ${message.currentViews} -> ${updatedMessage.currentViews}`);
            
            // Set expiry info
            if (updatedMessage.maxViews !== null) {
              const remainingViews = updatedMessage.maxViews - updatedMessage.currentViews;
              const expiryMessage = `This message will be deleted ${remainingViews <= 0 ? 'after this view' : `after ${remainingViews} more view${remainingViews !== 1 ? 's' : ''}`}.`;
              setExpiryInfo(expiryMessage);
              addDebugInfo(expiryMessage);
            } else if (updatedMessage.expiresAt) {
              const expiryDate = new Date(updatedMessage.expiresAt);
              const expiryMessage = `This message will expire on ${expiryDate.toLocaleString()}.`;
              setExpiryInfo(expiryMessage);
              addDebugInfo(expiryMessage);
            }
          } else {
            addDebugInfo("Failed to increment view count", 'warning');
          }
          
          // Set the decrypted message
          setDecryptedMessage(decrypted);
          
          // Success notification
          toast.success("Message decrypted successfully");
          
          // Store the key in localStorage to enable future access
          if (message.id && keyFragment) {
            storeKeyForFutureAccess(message.id, keyFragment);
          }
          
          // Clear URL fragment for security but preserve the path and query
          if (window.history.replaceState) {
            const { pathname, search } = window.location;
            window.history.replaceState(null, "", pathname + search);
            addDebugInfo("URL fragment cleared for security");
          }
        } catch (error) {
          console.error("Decryption error:", error);
          if (error instanceof Error) {
            setError(`Failed to decrypt the message. ${error.message}`);
            addDebugInfo(`Decryption error: ${error.message}`, 'error');
          } else {
            setError("Failed to decrypt the message. This might be due to an incorrect key or the message was encrypted with a different version of the app.");
            addDebugInfo("Unknown decryption error", 'error');
          }
        }
      } catch (error) {
        console.error("Error viewing message:", error);
        if (error instanceof Error) {
          setError(`Failed to view message. ${error.message}`);
          addDebugInfo(`Error viewing message: ${error.message}`, 'error');
        } else {
          setError("Failed to view message. An unknown error occurred.");
          addDebugInfo("Unknown error viewing message", 'error');
        }
      } finally {
        setLoading(false);
      }
    };
    
    decryptAndViewMessage();
  }, [id, isSignedIn, user?.id, user?.primaryEmailAddress?.emailAddress]);

  // Store the key for future accesses from this browser/device
  const storeKeyForFutureAccess = (messageId: string, key: string) => {
    try {
      import("@/lib/storage").then(storage => {
        storage.storeEncryptionKey(messageId, key);
        addDebugInfo("Stored decryption key for future use", 'success');
      });
    } catch (error) {
      addDebugInfo("Failed to store decryption key for future use", 'warning');
    }
  };
  
  // Helper function to find common prefix between two strings
  const getCommonPrefix = (str1: string, str2: string): string => {
    let i = 0;
    while (i < str1.length && i < str2.length && str1[i] === str2[i]) {
      i++;
    }
    return str1.substring(0, i);
  };
  
  return { decryptedMessage, loading, error, expiryInfo, debugInfo };
};
