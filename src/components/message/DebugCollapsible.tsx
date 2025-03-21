
import React, { useState } from "react";
import { Bug, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getStorageStats } from "@/lib/storage";

interface DebugCollapsibleProps {
  debugInfo: string[];
}

const DebugCollapsible = ({ debugInfo }: DebugCollapsibleProps) => {
  const [showDebug, setShowDebug] = useState(false);
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

  // Get storage stats for debugging
  const storageStats = getStorageStats();
  
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
        <div className="mb-4 p-3 bg-black/5 rounded text-xs font-mono h-40 overflow-auto">
          {/* Storage stats for debugging */}
          <div className="flex items-center mb-2 text-sm border-b pb-2">
            <Database className="h-3.5 w-3.5 mr-1" />
            <span>Storage: {storageStats.messages} messages, {storageStats.keys} keys, {storageStats.totalItems} localStorage items</span>
          </div>

          {/* Debug logs */}
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
  );
};

export default DebugCollapsible;
