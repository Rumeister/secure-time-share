
import React, { useState } from "react";
import { Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface DebugCollapsibleProps {
  debugInfo: string[];
}

const DebugCollapsible = ({ debugInfo }: DebugCollapsibleProps) => {
  const [showDebug, setShowDebug] = useState(false);
  
  return (
    <Collapsible>
      <div className="flex justify-center mb-4">
        <CollapsibleTrigger asChild>
          <Button 
            variant={debugInfo.some(log => log.toLowerCase().includes("error")) ? "destructive" : "ghost"}
            size="sm" 
            onClick={() => setShowDebug(!showDebug)} 
            className="text-xs flex items-center"
          >
            <Bug className="mr-1 h-3.5 w-3.5" />
            {showDebug ? "Hide Debug Info" : `Show Debug Info${
              debugInfo.some(log => log.toLowerCase().includes("error")) ? " (Has Errors)" : ""
            }`}
          </Button>
        </CollapsibleTrigger>
      </div>
      
      <CollapsibleContent>
        <div className="mb-4 p-3 bg-black/5 rounded text-xs font-mono h-40 overflow-auto">
          {debugInfo.length > 0 ? debugInfo.map((log, i) => (
            <div 
              key={i} 
              className={log.toLowerCase().includes("error") ? "text-red-500" : ""}
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
