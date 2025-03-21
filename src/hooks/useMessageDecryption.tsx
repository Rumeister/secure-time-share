
import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { decryptMessage, importKey } from "@/lib/encryption";
import { getMessage, incrementMessageViews, isMessageExpired, deleteMessage, getEncryptionKey } from "@/lib/storage";
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
        
        // List all message IDs in localStorage for debugging
        try {
          const messagesString = localStorage.getItem('secureMessages');
          const messages = messagesString ? JSON.parse(messagesString) : [];
          addDebugInfo(`Found ${messages.length} messages in localStorage`);
          if (messages.length > 0) {
            addDebugInfo(`Available message IDs: ${messages.map((m: any) => m.id).join(', ')}`);
          }
        } catch (e) {
          addDebugInfo(`Error checking localStorage messages: ${e instanceof Error ? e.message : String(e)}`, 'error');
        }
        
        // Get encrypted message from storage
        const message = getMessage(id);
        
        if (!message) {
          setError("Message not found. It may have been deleted or expired.");
          addDebugInfo(`Message with ID ${id} not found in storage`, 'error');
          addDebugInfo("Checking localStorage directly...");
          
          // Direct check in localStorage for debugging
          try {
            const allStorage = { ...localStorage };
            addDebugInfo(`All localStorage keys: ${Object.keys(allStorage).join(', ')}`);
            
            // Check if secureMessages exists and has content
            const secureMessages = localStorage.getItem('secureMessages');
            if (!secureMessages) {
              addDebugInfo("'secureMessages' key not found in localStorage", 'error');
            } else if (secureMessages === '[]') {
              addDebugInfo("'secureMessages' is empty array", 'warning');
            } else {
              addDebugInfo(`'secureMessages' exists and has content (length: ${secureMessages.length})`);
            }
          } catch (e) {
            addDebugInfo(`Error accessing localStorage directly: ${e instanceof Error ? e.message : String(e)}`, 'error');
          }
          
          setLoading(false);
          return;
        }
        
        addDebugInfo(`Message found in storage, created at: ${new Date(message.createdAt).toLocaleString()}`, 'success');
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
        if (!keyFragment && isSignedIn) {
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
            // In a real app, you would fetch the key from a secure server
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
          // Import the key with error handling
          addDebugInfo("Attempting to import key...");
          const key = await importKey(keyFragment);
          addDebugInfo("Key imported successfully", 'success');
          
          // Decrypt the message with enhanced encryption
          addDebugInfo("Attempting to decrypt message...");
          const decrypted = await decryptMessage(message.encryptedContent, key);
          
          // Validate the decrypted content
          if (!decrypted || decrypted.length === 0) {
            throw new Error("Decryption resulted in empty content");
          }
          
          addDebugInfo(`Message decrypted successfully, length: ${decrypted.length}`, 'success');
          
          // Update view count
          const updatedMessage = incrementMessageViews(id);
          
          if (updatedMessage) {
            // Set expiry info
            if (updatedMessage.maxViews !== null) {
              const remainingViews = updatedMessage.maxViews - updatedMessage.currentViews;
              setExpiryInfo(`This message will be deleted ${remainingViews <= 0 ? 'after this view' : `after ${remainingViews} more view${remainingViews !== 1 ? 's' : ''}`}.`);
            } else if (updatedMessage.expiresAt) {
              const expiryDate = new Date(updatedMessage.expiresAt);
              setExpiryInfo(`This message will expire on ${expiryDate.toLocaleString()}.`);
            }
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
