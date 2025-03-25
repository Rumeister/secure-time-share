
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LockKeyhole, Copy, Check, Clock, Eye, Users, Link } from "lucide-react";
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
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { 
  encryptMessage, 
  generateKey, 
  exportKey, 
  generateToken 
} from "@/lib/encryption";
import { saveMessage, getUserId, storeEncryptionKey, getAllMessages } from "@/lib/storage";
import { useUser } from "@clerk/clerk-react";

interface UserShareFormProps {
  messageId: string;
  encryptedContent: string;
  exportedKey: string;
  onClose: () => void;
}

// Component for sharing with specific users
const UserShareForm = ({ messageId, encryptedContent, exportedKey, onClose }: UserShareFormProps) => {
  const { user } = useUser();
  const [selectedUser, setSelectedUser] = useState("");
  const [loading, setLoading] = useState(false);
  
  // In a real app, this would fetch users from your backend
  // For now we'll simulate this with a placeholder
  const userFriends = [
    { id: "user1", username: "alice" },
    { id: "user2", username: "bob" },
    { id: "user3", username: "charlie" },
  ];
  
  const handleShareWithUser = async () => {
    if (!selectedUser) {
      toast.error("Please select a user to share with");
      return;
    }
    
    setLoading(true);
    
    try {
      // In a real implementation, you would:
      // 1. Store the message in a database
      // 2. Create a relationship between the message and the recipient
      // 3. Notify the recipient
      
      // For now, we'll simulate a successful share
      setTimeout(() => {
        toast.success(`Message shared with ${selectedUser}!`);
        setLoading(false);
        onClose();
      }, 1000);
    } catch (error) {
      console.error("Error sharing message:", error);
      toast.error("Failed to share message. Please try again.");
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Share this message directly with another user of the app.
      </p>
      
      <div className="space-y-2">
        <Label htmlFor="user-select">Select User</Label>
        <Select value={selectedUser} onValueChange={setSelectedUser}>
          <SelectTrigger id="user-select" className="glass-input">
            <SelectValue placeholder="Select a user" />
          </SelectTrigger>
          <SelectContent>
            {userFriends.map((friend) => (
              <SelectItem key={friend.id} value={friend.username}>
                {friend.username}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Button 
        onClick={handleShareWithUser} 
        className="w-full"
        disabled={loading || !selectedUser}
      >
        {loading ? (
          <div className="flex items-center">
            <div className="h-4 w-4 border-2 border-current border-t-transparent animate-spin rounded-full mr-2"></div>
            <span>Sharing...</span>
          </div>
        ) : (
          <span>Share with User</span>
        )}
      </Button>
    </div>
  );
};

// Main MessageForm component
const MessageForm = () => {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [expiration, setExpiration] = useState("1h");
  const [shareLink, setShareLink] = useState("");
  const [messageId, setMessageId] = useState("");
  const [encryptedContent, setEncryptedContent] = useState("");
  const [exportedKey, setExportedKey] = useState("");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareMethod, setShareMethod] = useState<"link" | "user">("link");
  const [copied, setCopied] = useState(false);
  
  const handleExpirationChange = (value: string) => {
    setExpiration(value);
  };
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast.error("Failed to copy link. Please select and copy it manually.");
    }
  };
  
  const handleCreateMessage = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }
    
    setLoading(true);
    
    try {
      // First, ensure storage is initialized
      import("@/lib/storage").then(storage => {
        storage.initializeStorage();
      });
      
      // Generate encryption key
      const key = await generateKey();
      const keyString = await exportKey(key);
      
      // Encrypt the message
      const encrypted = await encryptMessage(message, key);
      
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
      
      // Create the message object
      const messageObj = {
        id,
        encryptedContent: encrypted,
        expiresAt,
        maxViews,
        currentViews: 0,
        createdAt: Date.now(),
      };
      
      // Save the encrypted message to storage
      const success = saveMessage(messageObj);
      
      if (!success) {
        console.error("Failed to save message to storage");
        toast.error("Error saving your message. Please try again.");
        setLoading(false);
        return;
      }
      
      console.log(`Message created with ID ${id}, checking storage...`);
      
      // Verify the message was saved correctly
      try {
        // Verify in localStorage
        const savedMessage = localStorage.getItem('secureMessages');
        console.log(`Storage after saving: ${savedMessage ? 'contains data' : 'empty'}, length: ${savedMessage?.length || 0}`);
        
        // Check if the message is actually stored
        const allMessages = getAllMessages();
        console.log(`Retrieved ${allMessages.length} messages after saving, message exists: ${
          allMessages.some(m => m.id === id) ? 'yes' : 'no'
        }`);
        
        if (allMessages.length === 0 || !allMessages.some(m => m.id === id)) {
          console.error("Message was not properly saved to storage!");
          
          // Try an emergency direct save
          try {
            localStorage.setItem('secureMessages', JSON.stringify([messageObj]));
            console.log("Attempted emergency direct save of message");
            
            // Check if it worked
            const emergencyCheck = localStorage.getItem('secureMessages');
            if (!emergencyCheck || emergencyCheck === '[]') {
              toast.error("Storage error: Could not save your message. Please try again.");
              setLoading(false);
              return;
            }
          } catch (e) {
            console.error("Emergency storage attempt failed:", e);
            toast.error("Storage error: Could not save your message. Please try again.");
            setLoading(false);
            return;
          }
        }
        
        // Store the encryption key for future access
        storeEncryptionKey(id, keyString);
      } catch (e) {
        console.error("Error verifying message storage:", e);
        toast.error("Error verifying message storage. Please try again.");
        setLoading(false);
        return;
      }
      
      // Generate share link with the key in the fragment
      const baseUrl = window.location.origin;
      const shareUrl = `${baseUrl}/view/${id}#${keyString}`;
      
      // Save values for sharing options
      setShareLink(shareUrl);
      setMessageId(id);
      setEncryptedContent(encrypted);
      setExportedKey(keyString);
      
      // Set default share method based on auth status
      setShareMethod(isSignedIn ? "user" : "link");
      
      // Show sharing dialog
      setShowShareDialog(true);
      
      // Reset form
      setMessage("");
      
      // Success notification
      toast.success("Secure message created successfully!");
    } catch (error) {
      console.error("Error creating message:", error);
      toast.error("Failed to create secure message. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleCloseDialog = () => {
    setShowShareDialog(false);
    // Reset all sharing state
    setShareLink("");
    setMessageId("");
    setEncryptedContent("");
    setExportedKey("");
    setCopied(false);
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
              Your message will be encrypted in your browser and can only be decrypted by someone with the share link or by a recipient you choose.
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
              Choose how you want to share this message.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue={shareMethod} className="mt-4" onValueChange={(value) => setShareMethod(value as "link" | "user")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="link" className="flex items-center">
                <Link className="h-4 w-4 mr-2" />
                <span>Share via Link</span>
              </TabsTrigger>
              <TabsTrigger value="user" className="flex items-center" disabled={!isSignedIn}>
                <Users className="h-4 w-4 mr-2" />
                <span>Share with User</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="link" className="space-y-4 mt-4">
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
                  <li>For cross-device sharing, the complete link must be shared</li>
                </ul>
              </div>
            </TabsContent>
            
            <TabsContent value="user" className="space-y-4 mt-4">
              {isSignedIn ? (
                <UserShareForm 
                  messageId={messageId}
                  encryptedContent={encryptedContent}
                  exportedKey={exportedKey}
                  onClose={handleCloseDialog}
                />
              ) : (
                <div className="text-center p-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    You must be signed in to share with specific users.
                  </p>
                  <Button onClick={() => navigate("/sign-in")}>Sign In</Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={handleCloseDialog}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MessageForm;
