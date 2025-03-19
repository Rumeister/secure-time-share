
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LockKeyhole, Copy, Check, Clock, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  encryptMessage, 
  generateKey, 
  exportKey, 
  generateToken 
} from "@/lib/encryption";
import { saveMessage } from "@/lib/storage";

const MessageForm = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [expiration, setExpiration] = useState("1h");
  const [shareLink, setShareLink] = useState("");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const handleExpirationChange = (value: string) => {
    setExpiration(value);
  };
  
  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleCreateMessage = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }
    
    setLoading(true);
    
    try {
      // Generate encryption key
      const key = await generateKey();
      const exportedKey = await exportKey(key);
      
      // Encrypt the message
      const encryptedContent = await encryptMessage(message, key);
      
      // Generate a unique ID for the message
      const id = generateToken();
      
      // Calculate expiration
      let expiresAt: number | null = null;
      let maxViews: number | null = null;
      
      if (expiration === "view1") {
        maxViews = 1;
      } else if (expiration === "view3") {
        maxViews = 3;
      } else {
        const now = Date.now();
        if (expiration === "1h") {
          expiresAt = now + 3600000; // 1 hour
        } else if (expiration === "1d") {
          expiresAt = now + 86400000; // 1 day
        } else if (expiration === "7d") {
          expiresAt = now + 604800000; // 7 days
        }
      }
      
      // Save the encrypted message to storage
      saveMessage({
        id,
        encryptedContent,
        expiresAt,
        maxViews,
        currentViews: 0,
        createdAt: Date.now(),
      });
      
      // Generate share link with the key in the fragment
      const baseUrl = window.location.origin;
      const shareUrl = `${baseUrl}/view/${id}#${exportedKey}`;
      
      setShareLink(shareUrl);
      setShowShareDialog(true);
      
      // Reset form
      setMessage("");
    } catch (error) {
      console.error("Error creating message:", error);
      toast.error("Failed to create secure message. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <div className="glass-card p-6 md:p-8 w-full max-w-2xl mx-auto animate-scale-in">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center">
              <LockKeyhole className="h-5 w-5 text-primary mr-2" />
              <h2 className="text-2xl font-semibold tracking-tight">Secure Message</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Your message will be encrypted in your browser and can only be decrypted by someone with the share link.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Your Message</Label>
            <Textarea
              id="message"
              placeholder="Enter your sensitive message here..."
              className="min-h-[150px] glass-input text-base"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="expiration">Expiration Setting</Label>
            <Select value={expiration} onValueChange={handleExpirationChange}>
              <SelectTrigger id="expiration" className="glass-input">
                <SelectValue placeholder="Select expiration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>1 hour</span>
                  </div>
                </SelectItem>
                <SelectItem value="1d">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>1 day</span>
                  </div>
                </SelectItem>
                <SelectItem value="7d">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>7 days</span>
                  </div>
                </SelectItem>
                <SelectItem value="view1">
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 mr-2" />
                    <span>After 1 view</span>
                  </div>
                </SelectItem>
                <SelectItem value="view3">
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 mr-2" />
                    <span>After 3 views</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {expiration === "view1" 
                ? "Your message will be deleted immediately after being viewed once."
                : expiration === "view3"
                ? "Your message will be deleted after being viewed 3 times."
                : `Your message will expire after ${
                    expiration === "1h" ? "1 hour" : 
                    expiration === "1d" ? "1 day" : 
                    "7 days"
                  }.`
              }
            </p>
          </div>
          
          <Button 
            onClick={handleCreateMessage} 
            className="w-full"
            disabled={loading || !message.trim()}
          >
            {loading ? (
              <div className="flex items-center">
                <div className="h-4 w-4 border-2 border-current border-t-transparent animate-spin rounded-full mr-2"></div>
                <span>Encrypting...</span>
              </div>
            ) : (
              <span>Create Secure Message</span>
            )}
          </Button>
        </div>
      </div>
      
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md glass-card">
          <DialogHeader>
            <DialogTitle>Secure Message Created</DialogTitle>
            <DialogDescription>
              Share this link with the recipient. For maximum security, send it using a different communication channel than you normally use.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="flex items-center space-x-2">
              <Input
                value={shareLink}
                readOnly
                className="glass-input font-mono text-sm flex-1"
              />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleCopyLink}
                className="transition-all duration-300"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Important Security Notes:</h4>
              <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                <li>This link contains the decryption key - anyone with it can read your message</li>
                <li>The link will only work until the message expires</li>
                <li>Once expired, the message is permanently deleted</li>
              </ul>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={() => setShowShareDialog(false)}>Done</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MessageForm;
