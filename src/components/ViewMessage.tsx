
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { LockKeyhole, ShieldAlert, Clock, Eye, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { decryptMessage, importKey } from "@/lib/encryption";
import { getMessage, incrementMessageViews, isMessageExpired, deleteMessage } from "@/lib/storage";

const ViewMessage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [decryptedMessage, setDecryptedMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expiryInfo, setExpiryInfo] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    const decryptAndViewMessage = async () => {
      if (!id) {
        setError("Invalid message ID");
        setLoading(false);
        return;
      }
      
      try {
        // Get encrypted message from storage
        const message = getMessage(id);
        
        if (!message) {
          setError("Message not found. It may have been deleted or expired.");
          setLoading(false);
          return;
        }
        
        // Check if message is expired
        if (isMessageExpired(message)) {
          deleteMessage(id);
          setError("This message has expired and is no longer available.");
          setLoading(false);
          return;
        }
        
        // Get the key from URL fragment
        const keyFragment = window.location.hash.substring(1);
        
        if (!keyFragment) {
          setError("Missing decryption key. The URL may be incomplete.");
          setLoading(false);
          return;
        }
        
        // Import the key
        const key = await importKey(keyFragment);
        
        // Decrypt the message
        const decrypted = await decryptMessage(message.encryptedContent, key);
        
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
        
        // Clear URL fragment for security
        if (history.replaceState) {
          history.replaceState(null, "", window.location.pathname);
        }
      } catch (error) {
        console.error("Error viewing message:", error);
        setError("Failed to decrypt the message. The key may be incorrect.");
      } finally {
        setLoading(false);
      }
    };
    
    decryptAndViewMessage();
  }, [id]);
  
  const handleCopyMessage = async () => {
    if (decryptedMessage) {
      await navigator.clipboard.writeText(decryptedMessage);
      setCopied(true);
      toast.success("Message copied to clipboard!");
      
      setTimeout(() => setCopied(false), 2000);
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
