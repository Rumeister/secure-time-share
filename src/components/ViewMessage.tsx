
import { useParams, useNavigate } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMessageDecryption } from "@/hooks/useMessageDecryption";
import MessageLoading from "./message/MessageLoading";
import MessageError from "./message/MessageError";
import MessageContent from "./message/MessageContent";
import DebugCollapsible from "./message/DebugCollapsible";

const ViewMessage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { decryptedMessage, loading, error, expiryInfo, debugInfo } = useMessageDecryption(id);
  
  if (loading) {
    return <MessageLoading />;
  }
  
  if (error) {
    return <MessageError error={error} debugInfo={debugInfo} />;
  }
  
  return (
    <div className="glass-card p-6 md:p-8 w-full max-w-2xl mx-auto animate-scale-in">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <LockKeyhole className="h-5 w-5 text-primary mr-2" />
            <h2 className="text-2xl font-semibold tracking-tight">Secure Message</h2>
          </div>
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
