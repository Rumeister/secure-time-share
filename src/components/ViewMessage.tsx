
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { LockKeyhole, ShieldAlert, Clock, Eye, Copy, Check, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { decryptMessage, importKey } from "@/lib/encryption";
import { getMessage, incrementMessageViews, isMessageExpired, deleteMessage } from "@/lib/storage";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const ViewMessage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [decryptedMessage, setDecryptedMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expiryInfo, setExpiryInfo] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  
  // Add a debug log function
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
  
  const handleCopyMessage = async () => {
    if (decryptedMessage) {
      try {
        await navigator.clipboard.writeText(decryptedMessage);
        setCopied(true);
        toast.success("Message copied to clipboard!");
        
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
        toast.error("Unable to copy to clipboard. Please select and copy manually.");
      }
    }
  };
  
  if (loading) {
    return (
      <div className="glass-card p-6 md:p-8 w-full max-w-2xl mx-auto animate-pulse space-y-6">
        <div className="flex justify-center items-center h-12">
          <div className="h-6 w-6 border-2 border-primary border-t-transparent animate-spin rounded-full"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
        <div className="h-32 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="glass-card p-6 md:p-8 w-full max-w-2xl mx-auto animate-scale-in space-y-6">
        <div className="flex justify-center">
          <ShieldAlert className="h-16 w-16 text-destructive" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">Message Unavailable</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
        
        <Collapsible>
          <div className="flex justify-center">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" onClick={() => setShowDebug(!showDebug)} className="text-xs flex items-center">
                <Bug className="mr-1 h-3.5 w-3.5" />
                {showDebug ? "Hide Debug Info" : "Show Debug Info"}
              </Button>
            </CollapsibleTrigger>
          </div>
          
          <CollapsibleContent>
            <div className="mt-4 p-3 bg-black/5 rounded text-xs font-mono h-40 overflow-auto">
              {debugInfo.length > 0 ? debugInfo.map((log, i) => (
                <div key={i}>{log}</div>
              )) : "No debug information available"}
            </div>
          </CollapsibleContent>
        </Collapsible>
        
        <div className="flex justify-center pt-4">
          <Button onClick={() => navigate("/create")}>Create a New Message</Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="glass-card p-6 md:p-8 w-full max-w-2xl mx-auto animate-scale-in">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <LockKeyhole className="h-5 w-5 text-primary mr-2" />
            <h2 className="text-2xl font-semibold tracking-tight">Secure Message</h2>
          </div>
          {expiryInfo && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 mr-1" />
              {expiryInfo}
            </div>
          )}
        </div>
        
        <div className="relative border rounded-lg p-4 bg-white/50">
          <div className="whitespace-pre-wrap break-words">{decryptedMessage}</div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyMessage}
            className="absolute top-2 right-2 h-8 w-8 p-0"
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            <span className="font-medium">Security Note:</span> This message is end-to-end encrypted and stored locally on your device.
          </p>
          {expiryInfo && <p>{expiryInfo}</p>}
        </div>
        
        <Collapsible>
          <div className="flex justify-center mb-4">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" onClick={() => setShowDebug(!showDebug)} className="text-xs flex items-center">
                <Bug className="mr-1 h-3.5 w-3.5" />
                {showDebug ? "Hide Debug Info" : "Show Debug Info"}
              </Button>
            </CollapsibleTrigger>
          </div>
          
          <CollapsibleContent>
            <div className="mb-4 p-3 bg-black/5 rounded text-xs font-mono h-40 overflow-auto">
              {debugInfo.length > 0 ? debugInfo.map((log, i) => (
                <div key={i}>{log}</div>
              )) : "No debug information available"}
            </div>
          </CollapsibleContent>
        </Collapsible>
        
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => window.history.back()}>
            Go Back
          </Button>
          <Button onClick={() => navigate("/create")}>Create New Message</Button>
        </div>
      </div>
    </div>
  );
};

export default ViewMessage;
