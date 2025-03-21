
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, UserButton } from "@clerk/clerk-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LockKeyhole, Clock, Eye, Plus, Copy, Check, Share } from "lucide-react";
import { Link } from "react-router-dom";
import { getUserMessages, MessageData, deleteMessage } from "@/lib/storage";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { exportKey, importKey } from "@/lib/encryption"; 

interface ShareDialogProps {
  message: MessageData;
  isOpen: boolean;
  onClose: () => void;
}

const ShareDialog = ({ message, isOpen, onClose }: ShareDialogProps) => {
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Generate the share link when the dialog opens
  useEffect(() => {
    if (isOpen && message) {
      const generateShareLink = async () => {
        try {
          setLoading(true);
          
          // In a real implementation, you would retrieve the key associated with this message
          // For now, we'll generate a placeholder link
          const baseUrl = window.location.origin;
          const link = `${baseUrl}/view/${message.id}#your-key-would-be-here`;
          
          setShareLink(link);
        } catch (error) {
          console.error("Error generating share link:", error);
          toast.error("Failed to generate share link");
        } finally {
          setLoading(false);
        }
      };
      
      generateShareLink();
    }
  }, [isOpen, message]);
  
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
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md glass-card">
        <DialogHeader>
          <DialogTitle>Share Secure Message</DialogTitle>
          <DialogDescription>
            Share this link with the recipient to view your secure message.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {loading ? (
            <div className="flex justify-center p-4">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent animate-spin rounded-full"></div>
            </div>
          ) : (
            <>
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
                  <li>For cross-device sharing, the complete link must be shared</li>
                </ul>
              </div>
            </>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Dashboard = () => {
  const { isSignedIn, user } = useUser();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [shareMessage, setShareMessage] = useState<MessageData | null>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  useEffect(() => {
    if (!isSignedIn) {
      navigate('/sign-in');
      return;
    }

    // Load user's messages
    const userMessages = getUserMessages();
    setMessages(userMessages);
  }, [isSignedIn, navigate]);

  const formatExpiration = (message: MessageData) => {
    if (message.maxViews) {
      return `${message.maxViews - (message.currentViews || 0)} views remaining`;
    } else if (message.expiresAt) {
      const now = Date.now();
      const remaining = message.expiresAt - now;
      
      if (remaining <= 0) {
        return "Expired";
      }
      
      const hours = Math.floor(remaining / (60 * 60 * 1000));
      
      if (hours >= 24) {
        const days = Math.floor(hours / 24);
        return `${days} day${days > 1 ? 's' : ''} remaining`;
      }
      
      return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
    }
    
    return "Unknown";
  };
  
  const handleShareMessage = (message: MessageData) => {
    setShareMessage(message);
    setIsShareDialogOpen(true);
  };
  
  const handleDeleteMessage = (id: string) => {
    try {
      deleteMessage(id);
      setMessages(messages.filter(message => message.id !== id));
      toast.success("Message deleted successfully");
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    }
  };
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your secure messages
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button asChild>
              <Link to="/create">
                <Plus className="mr-2 h-4 w-4" />
                Create New
              </Link>
            </Button>
            <UserButton 
              appearance={{
                elements: {
                  userButtonBox: "h-10 w-10",
                  userButtonTrigger: "h-10 w-10 rounded-full border-2 border-white/20",
                  userButtonAvatarBox: "h-full w-full",
                }
              }}
            />
          </div>
        </div>
        
        {messages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {messages.map((message) => (
              <Card key={message.id} className="glass-card hover:shadow-lg transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LockKeyhole className="h-5 w-5 text-primary" />
                    Secure Message
                  </CardTitle>
                  <CardDescription>
                    Created {new Date(message.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {message.maxViews ? (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm text-muted-foreground">
                      {formatExpiration(message)}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleShareMessage(message)}
                  >
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="icon"
                    onClick={() => handleDeleteMessage(message.id)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2">
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      <line x1="10" x2="10" y1="11" y2="17" />
                      <line x1="14" x2="14" y1="11" y2="17" />
                    </svg>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="glass-card p-12 text-center rounded-lg">
            <LockKeyhole className="h-12 w-12 text-primary mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-medium mb-2">No secure messages yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first secure message to get started
            </p>
            <Button asChild>
              <Link to="/create">
                <Plus className="mr-2 h-4 w-4" />
                Create New Message
              </Link>
            </Button>
          </div>
        )}
      </div>
      
      {shareMessage && (
        <ShareDialog 
          message={shareMessage}
          isOpen={isShareDialogOpen}
          onClose={() => {
            setIsShareDialogOpen(false);
            setShareMessage(null);
          }}
        />
      )}
    </Layout>
  );
};

export default Dashboard;
