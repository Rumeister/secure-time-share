
import React, { useState, useEffect } from "react";
import { Bug, Database, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getStorageStats } from "@/lib/storage";
import { Separator } from "@/components/ui/separator";

interface DebugCollapsibleProps {
  debugInfo: string[];
}

const DebugCollapsible = ({ debugInfo }: DebugCollapsibleProps) => {
  const [showDebug, setShowDebug] = useState(false);
  const [storageInfo, setStorageInfo] = useState<{
    messages: number;
    keys: number;
    totalItems: number;
    messageIds: string[];
    keyIds: string[];
  }>({
    messages: 0,
    keys: 0,
    totalItems: 0,
    messageIds: [],
    keyIds: []
  });
  
  const hasErrors = debugInfo.some(log => log.toLowerCase().includes("error"));
  const hasWarnings = debugInfo.some(log => log.toLowerCase().includes("warning"));
  
  // Get the variant based on log content
  const getButtonVariant = () => {
    if (hasErrors) return "destructive";
    if (hasWarnings) return "outline";
    return "ghost";
  };
  
  // Count the number of errors and warnings
  const errorCount = debugInfo.filter(log => log.toLowerCase().includes("error")).length;
  const warningCount = debugInfo.filter(log => log.toLowerCase().includes("warning")).length;

  // Update storage stats periodically
  useEffect(() => {
    const updateStorageInfo = () => {
      // Get basic storage stats 
      const stats = getStorageStats();
      
      // Get message IDs
      const messagesStr = localStorage.getItem('secureMessages');
      let messageIds: string[] = [];
      try {
        if (messagesStr) {
          const messages = JSON.parse(messagesStr);
          if (Array.isArray(messages)) {
            messageIds = messages.map(m => m.id);
          }
        }
      } catch (e) {
        console.error("Error parsing messages:", e);
      }
      
      // Get key IDs
      const keysStr = localStorage.getItem('secureMessageKeys');
      let keyIds: string[] = [];
      try {
        if (keysStr) {
          const keys = JSON.parse(keysStr);
          keyIds = Object.keys(keys);
        }
      } catch (e) {
        console.error("Error parsing keys:", e);
      }
      
      setStorageInfo({
        ...stats,
        messageIds,
        keyIds
      });
    };
    
    // Update immediately and then every 2 seconds if debug panel is open
    updateStorageInfo();
    
    let interval: number | null = null;
    if (showDebug) {
      interval = window.setInterval(updateStorageInfo, 2000);
    }
    
    return () => {
      if (interval !== null) {
        clearInterval(interval);
      }
    };
  }, [showDebug]);
  
  const refreshStorage = () => {
    // Get basic storage stats 
    const stats = getStorageStats();
    
    // Get message IDs
    const messagesStr = localStorage.getItem('secureMessages');
    let messageIds: string[] = [];
    try {
      if (messagesStr) {
        const messages = JSON.parse(messagesStr);
        if (Array.isArray(messages)) {
          messageIds = messages.map(m => m.id);
        }
      }
    } catch (e) {
      console.error("Error parsing messages:", e);
    }
    
    // Get key IDs
    const keysStr = localStorage.getItem('secureMessageKeys');
    let keyIds: string[] = [];
    try {
      if (keysStr) {
        const keys = JSON.parse(keysStr);
        keyIds = Object.keys(keys);
      }
    } catch (e) {
      console.error("Error parsing keys:", e);
    }
    
    setStorageInfo({
      ...stats,
      messageIds,
      keyIds
    });
  };
  
  return (
    <Collapsible>
      <div className="flex justify-center mb-4">
        <CollapsibleTrigger asChild>
          <Button 
            variant={getButtonVariant()}
            size="sm" 
            onClick={() => setShowDebug(!showDebug)} 
            className="text-xs flex items-center"
          >
            <Bug className="mr-1 h-3.5 w-3.5" />
            {showDebug ? "Hide Debug Info" : `Show Debug Info${
              hasErrors ? ` (${errorCount} Error${errorCount !== 1 ? 's' : ''})` : 
              hasWarnings ? ` (${warningCount} Warning${warningCount !== 1 ? 's' : ''})` : ""
            }`}
          </Button>
        </CollapsibleTrigger>
      </div>
      
      <CollapsibleContent>
        <div className="mb-4 p-3 bg-black/5 rounded text-xs">
          {/* Storage stats for debugging */}
          <div className="flex items-center justify-between mb-2 text-sm border-b pb-2">
            <div className="flex items-center">
              <Database className="h-3.5 w-3.5 mr-1" />
              <span>Storage: {storageInfo.messages} messages, {storageInfo.keys} keys, {storageInfo.totalItems} localStorage items</span>
            </div>
            <Button variant="ghost" size="sm" onClick={refreshStorage} className="h-6 w-6 p-0">
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
          
          {/* Message IDs */}
          {storageInfo.messageIds.length > 0 && (
            <div className="mb-2 text-xs">
              <div className="font-medium mb-1">Message IDs:</div>
              <div className="font-mono break-all text-[10px] bg-white/80 p-1 overflow-auto max-h-20 rounded">
                {storageInfo.messageIds.map((id, index) => (
                  <div key={index} className="mb-1">
                    {id}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Key IDs */}
          {storageInfo.keyIds.length > 0 && (
            <div className="mb-2 text-xs">
              <div className="font-medium mb-1">Key IDs:</div>
              <div className="font-mono break-all text-[10px] bg-white/80 p-1 overflow-auto max-h-20 rounded">
                {storageInfo.keyIds.map((id, index) => (
                  <div key={index} className="mb-1">
                    {id}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <Separator className="my-2" />
          
          {/* Debug logs with better styling */}
          <div className="font-medium mb-1">Debug Logs:</div>
          <div className="font-mono overflow-auto h-40 bg-white/80 p-2 rounded">
            {debugInfo.length > 0 ? debugInfo.map((log, i) => (
              <div 
                key={i} 
                className={
                  log.toLowerCase().includes("error") ? "text-red-500 font-semibold" : 
                  log.toLowerCase().includes("warning") ? "text-amber-500" : 
                  log.toLowerCase().includes("success") ? "text-green-600" : ""
                }
              >
                {log}
              </div>
            )) : "No debug information available"}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default DebugCollapsible;
