
import React, { useState } from "react";
import { ShieldAlert, Bug, RefreshCcw, PlusCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";

interface MessageErrorProps {
  error: string;
  debugInfo: string[];
  onRetry?: () => void;
  onCreateNew?: () => void;
  onClearCache?: () => void;
}

const MessageError = ({ error, debugInfo, onRetry, onCreateNew, onClearCache }: MessageErrorProps) => {
  const [showDebug, setShowDebug] = useState(false);

  return (
    <div className="glass-card p-6 md:p-8 w-full max-w-2xl mx-auto animate-scale-in space-y-6">
      <div className="flex justify-center">
        <ShieldAlert className="h-16 w-16 text-destructive" />
      </div>
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight">Message Unavailable</h2>
        <p className="text-muted-foreground">{error}</p>
        
        <div className="pt-2">
          <p className="text-sm">This may happen if:</p>
          <ul className="text-sm text-left list-disc list-inside max-w-md mx-auto mt-2 space-y-1">
            <li>The message has been viewed the maximum number of times</li>
            <li>The message has expired</li>
            <li>The URL is incomplete or incorrect</li>
            <li>The message was deleted by its creator</li>
            <li>There's a browser cache issue with stored messages</li>
          </ul>
        </div>
      </div>
      
      <Separator />
      
      <div className="flex justify-center gap-4 flex-wrap">
        {onClearCache && (
          <Button variant="secondary" onClick={onClearCache} className="flex items-center">
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Cache
          </Button>
        )}
        
        {onRetry && (
          <Button variant="outline" onClick={onRetry} className="flex items-center">
            <RefreshCcw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        )}
        
        {onCreateNew && (
          <Button onClick={onCreateNew} className="flex items-center">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Message
          </Button>
        )}
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
              {showDebug ? "Hide Debug Info" : "Show Technical Details"}
            </Button>
          </CollapsibleTrigger>
        </div>
        
        <CollapsibleContent>
          <div className="mt-4 p-3 bg-black/5 rounded text-xs font-mono h-40 overflow-auto">
            {debugInfo.length > 0 ? debugInfo.map((log, i) => (
              <div 
                key={i}
                className={
                  log.toLowerCase().includes("error") ? "text-red-500 font-bold" : 
                  log.toLowerCase().includes("warning") ? "text-amber-500" : 
                  log.toLowerCase().includes("success") ? "text-green-600" : ""
                }
              >
                {log}
              </div>
            )) : "No debug information available"}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default MessageError;
