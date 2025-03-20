
import React, { useState } from "react";
import { ShieldAlert, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface MessageErrorProps {
  error: string;
  debugInfo: string[];
}

const MessageError = ({ error, debugInfo }: MessageErrorProps) => {
  const navigate = useNavigate();
  const [showDebug, setShowDebug] = useState(false);

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
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowDebug(!showDebug)} 
              className="text-xs flex items-center"
            >
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
};

export default MessageError;
