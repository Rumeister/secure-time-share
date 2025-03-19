
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, UserButton } from "@clerk/clerk-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LockKeyhole, Clock, Eye, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { getUserMessages, MessageData } from "@/lib/storage";
import { toast } from "sonner";

const Dashboard = () => {
  const { isSignedIn, user } = useUser();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<MessageData[]>([]);

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
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      // This would typically generate a link to view the message
                      // that includes the encryption key, which we don't have here
                      toast.info("Share functionality coming soon!");
                    }}
                  >
                    Share Link
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
    </Layout>
  );
};

export default Dashboard;
