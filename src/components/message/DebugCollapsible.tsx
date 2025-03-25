
import React, { useState, useEffect } from "react";
import { Bug, Database, RefreshCw, Trash2, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getStorageStats, clearMessageCache, forceReloadStorage } from "@/lib/storage";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface DebugCollapsibleProps {
  debugInfo: string[];
}

const DebugCollapsible = ({ debugInfo }: DebugCollapsibleProps) => {
  const [showDebug, setShowDebug] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [storageInfo, setStorageInfo] = useState<{
    messages: number;
    keys: number;
    totalItems: number;
    messageIds: string[];
    keyIds: string[];
    rawContent: string | null;
  }>({
    messages: 0,
    keys: 0,
    totalItems: 0,
    messageIds: [],
    keyIds: [],
    rawContent: null
  });
  
  const hasErrors = debugInfo.some(log => log.toLowerCase().includes("error"));
  const hasWarnings = debugInfo.some(log => log.toLowerCase().includes("warning"));
  
  const getButtonVariant = () => {
    if (hasErrors) return "destructive";
    if (hasWarnings) return "outline";
    return "ghost";
  };
  
  const errorCount = debugInfo.filter(log => log.toLowerCase().includes("error")).length;
  const warningCount = debugInfo.filter(log => log.toLowerCase().includes("warning")).length;

  useEffect(() => {
    setLogs(debugInfo);
  }, [debugInfo]);

  const handleClearLogs = () => {
    setLogs([]);
    toast.success("Debug logs cleared");
  };

  useEffect(() => {
    const updateStorageInfo = () => {
      const stats = getStorageStats();
      
      const messagesStr = localStorage.getItem('secureMessages');
      let messageIds: string[] = [];
      let rawContent = null;
      
      try {
        if (messagesStr) {
          rawContent = messagesStr;
          
          if (messagesStr === '[]') {
            console.warn("secureMessages is an empty array in debug check");
            rawContent = "[]";
          } else {
            const messages = JSON.parse(messagesStr);
            if (Array.isArray(messages)) {
              messageIds = messages.map(m => m.id);
              console.log(`Found ${messages.length} messages in localStorage debug check`);
            } else {
              console.warn("secureMessages is not an array in debug check");
              rawContent = "ERROR: secureMessages is not an array: " + messagesStr;
            }
          }
        } else {
          rawContent = "null";
          console.warn("secureMessages is null in debug check");
        }
      } catch (e) {
        console.error("Error parsing messages:", e);
        rawContent = "ERROR: " + String(e);
      }
      
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
        keyIds,
        rawContent
      });
    };
    
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
    const stats = getStorageStats();
    
    const messagesStr = localStorage.getItem('secureMessages');
    let messageIds: string[] = [];
    let rawContent = null;
    
    try {
      if (messagesStr) {
        rawContent = messagesStr;
        if (messagesStr === '[]') {
          rawContent = "[]";
          console.warn("secureMessages is an empty array in debug check");
        } else {
          const messages = JSON.parse(messagesStr);
          if (Array.isArray(messages)) {
            messageIds = messages.map(m => m.id);
            console.log(`Found ${messages.length} messages in localStorage debug check`);
          } else {
            console.warn("secureMessages is not an array in debug check");
            rawContent = "ERROR: secureMessages is not an array: " + messagesStr;
          }
        }
      } else {
        rawContent = "null";
        console.warn("secureMessages is null in debug check");
      }
    } catch (e) {
      console.error("Error parsing messages:", e);
      rawContent = "ERROR: " + String(e);
    }
    
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
      keyIds,
      rawContent
    });
    
    toast.success("Storage information refreshed");
  };
  
  const handleClearCache = () => {
    const clearedItems = clearMessageCache(true);
    toast.success(`Cleared message cache (${clearedItems} items removed)`);
    refreshStorage();
  };
  
  const handleForceReload = () => {
    const success = forceReloadStorage();
    if (success) {
      toast.success("Storage reloaded successfully");
    } else {
      toast.warning("No messages to reload or reload failed");
    }
    refreshStorage();
  };
  
  const initializeStorage = () => {
    import("@/lib/storage").then(storage => {
      const initialized = storage.initializeStorage();
      if (initialized) {
        toast.success("Storage initialized successfully");
      } else {
        toast.error("Storage initialization failed");
      }
      refreshStorage();
    });
  };
  
  const resetStorage = () => {
    localStorage.setItem('secureMessages', '[]');
    localStorage.setItem('secureMessageKeys', '{}');
    localStorage.removeItem('lastCacheCleanup');
    toast.success("Storage reset to default empty state");
    refreshStorage();
  };
  
  const testCreateMessage = () => {
    // Create a simple test message directly
    import("@/lib/encryption").then(async (encryption) => {
      import("@/lib/storage").then(async (storage) => {
        try {
          // Generate a key and ID
          const key = await encryption.generateKey();
          const keyString = await encryption.exportKey(key);
          const id = encryption.generateToken();
          
          // Create a simple encrypted message
          const encrypted = await encryption.encryptMessage("Test message created at " + new Date().toLocaleString(), key);
          
          // Create message object
          const messageObj = {
            id,
            encryptedContent: encrypted,
            expiresAt: null,
            maxViews: 3,
            currentViews: 0,
            createdAt: Date.now(),
          };
          
          // Save it
          const success = storage.saveMessage(messageObj);
          
          if (success) {
            // Store the key
            storage.storeEncryptionKey(id, keyString);
            
            // Verify it exists
            const allMessages = storage.getAllMessages();
            if (allMessages.some(m => m.id === id)) {
              toast.success(`Test message created with ID: ${id}`);
              
              // Create a link for testing
              const baseUrl = window.location.origin;
              const testLink = `${baseUrl}/view/${id}#${keyString}`;
              
              // Copy to clipboard
              navigator.clipboard.writeText(testLink)
                .then(() => toast.success("Test link copied to clipboard!"))
                .catch(() => toast.error("Failed to copy link"));
              
              // Add to logs
              setLogs(prev => [...prev, `SUCCESS: Created test message with ID ${id}`]);
              setLogs(prev => [...prev, `INFO: Test link: ${testLink}`]);
            } else {
              toast.error("Test message creation failed - not found after save");
            }
          } else {
            toast.error("Failed to save test message");
          }
          
          refreshStorage();
        } catch (e) {
          console.error("Error creating test message:", e);
          toast.error("Error creating test message");
        }
      });
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
          <div className="flex items-center justify-between mb-2 text-sm border-b pb-2">
            <div className="flex items-center">
              <Database className="h-3.5 w-3.5 mr-1" />
              <span>Storage: {storageInfo.messages} messages, {storageInfo.keys} keys, {storageInfo.totalItems} localStorage items</span>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={initializeStorage} className="h-6" title="Initialize storage">
                <span className="text-xs">Init Storage</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={testCreateMessage} className="h-6" title="Create test message">
                <span className="text-xs">Test Message</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleForceReload} className="h-6" title="Force reload storage">
                <Save className="h-3 w-3 mr-1" />
                <span className="text-xs">Force Reload</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={refreshStorage} className="h-6 w-6 p-0">
                <RefreshCw className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleClearCache} className="h-6" title="Clear message cache">
                <Trash2 className="h-3 w-3 mr-1" /> 
                <span className="text-xs">Clear Cache</span>
              </Button>
              <Button variant="destructive" size="sm" onClick={resetStorage} className="h-6" title="Reset storage completely">
                <Trash2 className="h-3 w-3 mr-1" /> 
                <span className="text-xs">Reset All</span>
              </Button>
            </div>
          </div>
          
          {storageInfo.rawContent && (
            <div className="mb-2 text-xs">
              <div className="font-medium mb-1">Raw secureMessages content:</div>
              <div className="font-mono break-all text-[10px] bg-white/80 p-1 overflow-auto max-h-20 rounded">
                {storageInfo.rawContent}
              </div>
            </div>
          )}
          
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
          
          <div className="flex items-center justify-between mb-1">
            <div className="font-medium">Debug Logs:</div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearLogs} 
              className="h-6 px-2 py-0 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear Logs
            </Button>
          </div>
          <div className="font-mono overflow-auto h-40 bg-white/80 p-2 rounded">
            {logs.length > 0 ? logs.map((log, i) => (
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
