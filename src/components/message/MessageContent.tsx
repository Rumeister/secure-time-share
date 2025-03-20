
import React, { useState } from "react";
import { Clock, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface MessageContentProps {
  decryptedMessage: string;
  expiryInfo: string | null;
}

const MessageContent = ({ decryptedMessage, expiryInfo }: MessageContentProps) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(decryptedMessage);
      setCopied(true);
      toast.success("Message copied to clipboard!");
      
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Unable to copy to clipboard. Please select and copy manually.");
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="relative border rounded-lg p-4 bg-white/50">
        <div className="whitespace-pre-wrap break-words">{decryptedMessage}</div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopyMessage}
          className="absolute top-2 right-2 h-8 w-8 p-0"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      
      {expiryInfo && (
        <div className="text-xs text-muted-foreground flex items-center">
          <Clock className="h-3.5 w-3.5 mr-1" />
          {expiryInfo}
        </div>
      )}
    </div>
  );
};

export default MessageContent;
