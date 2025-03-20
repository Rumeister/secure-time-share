
import { useState, useEffect } from "react";
import { decryptMessage, importKey } from "@/lib/encryption";
import { getMessage, incrementMessageViews, isMessageExpired, deleteMessage } from "@/lib/storage";

interface UseMessageDecryptionResult {
  decryptedMessage: string | null;
  loading: boolean;
  error: string | null;
  expiryInfo: string | null;
  debugInfo: string[];
}

export const useMessageDecryption = (id: string | undefined): UseMessageDecryptionResult => {
  const [decryptedMessage, setDecryptedMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expiryInfo, setExpiryInfo] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  
  // Debug log function
  const addDebugInfo = (message: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toISOString().substring(11, 23)}: ${message}`]);
    console.log("DEBUG:", message);
  };
  
  useEffect(() => {
    const decryptAndViewMessage = async () => {
      if (!id) {
        setError("Invalid message ID");
        setLoading(false);
        return;
      }
      
      try {
        addDebugInfo(`Starting decryption process for message ID: ${id}`);
        
        // Get encrypted message from storage
        const message = getMessage(id);
        
        if (!message) {
          setError("Message not found. It may have been deleted or expired.");
          setLoading(false);
          return;
        }
        
        addDebugInfo(`Message found in storage, created at: ${new Date(message.createdAt).toLocaleString()}`);
        addDebugInfo(`Encrypted content length: ${message.encryptedContent.length}`);
        
        // Check if message is expired
        if (isMessageExpired(message)) {
          deleteMessage(id);
          setError("This message has expired and is no longer available.");
          setLoading(false);
          return;
        }
        
        // Check for URL fragment (key)
        let keyFragment = window.location.hash.substring(1);
        
        if (!keyFragment) {
          setError("Missing decryption key. The URL may be incomplete.");
          addDebugInfo("No key fragment found in URL hash");
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
          addDebugInfo("Key imported successfully");
          
          // Decrypt the message with enhanced encryption
          addDebugInfo("Attempting to decrypt message...");
          const decrypted = await decryptMessage(message.encryptedContent, key);
          addDebugInfo(`Message decrypted successfully, length: ${decrypted.length}`);
          
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
            addDebugInfo(`Decryption error: ${error.message}`);
          } else {
            setError("Failed to decrypt the message. This might be due to an incorrect key or the message was encrypted with a different version of the app.");
            addDebugInfo("Unknown decryption error");
          }
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error("Error viewing message:", error);
        if (error instanceof Error) {
          setError(`Failed to decrypt the message. ${error.message}`);
          addDebugInfo(`Error viewing message: ${error.message}`);
        } else {
          setError("Failed to decrypt the message. The key may be incorrect.");
          addDebugInfo("Unknown error viewing message");
        }
      } finally {
        setLoading(false);
      }
    };
    
    decryptAndViewMessage();
  }, [id]);
  
  return { decryptedMessage, loading, error, expiryInfo, debugInfo };
};
