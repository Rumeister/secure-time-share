
import { useParams, useNavigate } from "react-router-dom";
import { LockKeyhole, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMessageDecryption } from "@/hooks/useMessageDecryption";
import MessageLoading from "./message/MessageLoading";
import MessageError from "./message/MessageError";
import MessageContent from "./message/MessageContent";
import DebugCollapsible from "./message/DebugCollapsible";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const ViewMessage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { decryptedMessage, loading, error, expiryInfo, debugInfo } = useMessageDecryption(id);
  
  const handleReloadPage = () => {
    // Clear the URL fragment and reload to handle the case where the URL is malformed
    if (window.location.hash) {
      const keyFragment = window.location.hash.substring(1);
      
      // Try to re-navigate with a clean URL structure
      const { pathname } = window.location;
      const cleanUrl = `${pathname}#${keyFragment.trim()}`;
      
      window.location.href = cleanUrl;
    } else {
      window.location.reload();
    }
  };
  
  if (loading) {
    return <MessageLoading />;
  }
  
  if (error) {
    return <MessageError 
      error={error} 
      debugInfo={debugInfo} 
      onRetry={handleReloadPage}
      onCreateNew={() => navigate("/create")} 
    />;
  }
  
  return (
    <div className="glass-card p-6 md:p-8 w-full max-w-2xl mx-auto animate-scale-in">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Avatar className="h-6 w-6 mr-2">
              <AvatarImage src="/lovable-uploads/c3bf18e8-78c5-49f1-9604-51f7b2c3dca8.png" alt="Butterfly logo" />
              <AvatarFallback>
                <LockKeyhole className="h-4 w-4 text-primary" />
              </AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-semibold tracking-tight">Butterfly Message</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={handleReloadPage} title="Reload page">
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
        
        {decryptedMessage && (
          <MessageContent 
            decryptedMessage={decryptedMessage} 
            expiryInfo={expiryInfo} 
          />
        )}
        
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            <span className="font-medium">Security Note:</span> This message is end-to-end encrypted and stored locally on your device.
          </p>
          {expiryInfo && <p>{expiryInfo}</p>}
        </div>
        
        <DebugCollapsible debugInfo={debugInfo} />
        
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
