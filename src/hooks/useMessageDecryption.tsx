
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
                   level === 'success' ? 'SUCCESS: ' : '';
    setDebugInfo(prev => [...prev, `${new Date().toISOString().substring(11, 23)}: ${prefix}${message}`]);
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
        addDebugInfo(`Starting decryption process for message ID: ${id}`);
        
        // Show storage stats for debugging
        const stats = getStorageStats();
        addDebugInfo(`Storage contains ${stats.messages} messages and ${stats.keys} encryption keys`);
        
        // Get encrypted message from storage with more robust error handling
        const message = getMessage(id);
        
        if (!message) {
          setError("Message not found. It may have been deleted or expired.");
          addDebugInfo(`Message with ID ${id} not found in storage`, 'error');
          
          // Try to dump contents of localStorage for debugging
          try {
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
                  
                  // Check for similar IDs (partial matches)
                  const similarIds = parsedMessages.filter((m: any) => 
                    m.id.includes(id.substring(0, 10)) || id.includes(m.id.substring(0, 10))
                  );
                  
                  if (similarIds.length > 0) {
                    addDebugInfo(`Found ${similarIds.length} messages with similar IDs`, 'warning');
                    similarIds.forEach((m: any) => {
                      addDebugInfo(`Similar ID: ${m.id}, created: ${new Date(m.createdAt).toLocaleString()}`);
                    });
                  }
                }
              } catch (e) {
                addDebugInfo(`Error parsing messages JSON: ${e instanceof Error ? e.message : String(e)}`, 'error');
              }
            }
            
            // Also check encryption keys
            const keysStore = localStorage.getItem('secureMessageKeys');
            if (!keysStore) {
              addDebugInfo("'secureMessageKeys' not found in localStorage", 'warning');
            } else {
              try {
                const keys = JSON.parse(keysStore);
                const keyIds = Object.keys(keys);
                addDebugInfo(`Found ${keyIds.length} stored encryption keys`);
                if (keyIds.length > 0) {
                  addDebugInfo(`Available key IDs: ${keyIds.join(', ')}`);
                }
              } catch (e) {
                addDebugInfo(`Error parsing keys JSON: ${e instanceof Error ? e.message : String(e)}`, 'error');
              }
            }
            
          } catch (e) {
            addDebugInfo(`Error accessing localStorage: ${e instanceof Error ? e.message : String(e)}`, 'error');
          }
          
          setLoading(false);
          return;
        }
        
        addDebugInfo(`Message found in storage, created at: ${new Date(message.createdAt).toLocaleString()}`, 'success');
        addDebugInfo(`Message properties: maxViews=${message.maxViews}, currentViews=${message.currentViews}, expiresAt=${message.expiresAt ? new Date(message.expiresAt).toLocaleString() : 'never'}`);
        addDebugInfo(`Encrypted content length: ${message.encryptedContent.length}`);
        
        // Check if message is expired
        if (isMessageExpired(message)) {
          deleteMessage(id);
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
            
            // 1. Check if user created this message and has saved the key
            const storedKey = getEncryptionKey(id);
            if (storedKey) {
              addDebugInfo("Found stored encryption key for this message", 'success');
              keyFragment = storedKey;
            } 
            // 2. Check if this message was shared with the current user
            else if (message.sharedWithUsers?.includes(user?.id || "") || message.ownerId === user?.id) {
              addDebugInfo(`Message ownership: ${message.ownerId === user?.id ? 'User is owner' : 'Message shared with user'}`);
              // Try to get the key again (added redundancy)
              const storedSharedKey = getEncryptionKey(id);
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
          // Import the key with better error handling
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
          const updatedMessage = incrementMessageViews(id);
          
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
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error("Error viewing message:", error);
        if (error instanceof Error) {
          setError(`Failed to decrypt the message. ${error.message}`);
          addDebugInfo(`Error viewing message: ${error.message}`, 'error');
        } else {
          setError("Failed to decrypt the message. The key may be incorrect.");
          addDebugInfo("Unknown error viewing message", 'error');
        }
      } finally {
        setLoading(false);
      }
    };
    
    decryptAndViewMessage();
  }, [id, isSignedIn, user?.id, user?.primaryEmailAddress?.emailAddress]);
  
  return { decryptedMessage, loading, error, expiryInfo, debugInfo };
};
