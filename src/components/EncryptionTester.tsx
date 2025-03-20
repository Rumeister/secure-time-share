
import { useState } from "react";
import { 
  generateKey, 
  exportKey, 
  importKey, 
  encryptMessage, 
  decryptMessage 
} from "@/lib/encryption";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Copy, ArrowDown } from "lucide-react";

const EncryptionTester = () => {
  const [originalMessage, setOriginalMessage] = useState("Test message 123");
  const [generatedKey, setGeneratedKey] = useState<CryptoKey | null>(null);
  const [exportedKey, setExportedKey] = useState("");
  const [importedKey, setImportedKey] = useState<CryptoKey | null>(null);
  const [encryptedMessage, setEncryptedMessage] = useState("");
  const [decryptedMessage, setDecryptedMessage] = useState("");
  const [testUrl, setTestUrl] = useState("");
  const [keyFromUrl, setKeyFromUrl] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  
  // Add a log function to track the process
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString().substring(11, 23)}: ${message}`]);
  };
  
  const clearLogs = () => {
    setLogs([]);
  };
  
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };
  
  const runFullTest = async () => {
    clearLogs();
    addLog("Starting full encryption/decryption test");
    
    try {
      // Step 1: Generate a key
      addLog("Generating key...");
      const key = await generateKey();
      setGeneratedKey(key);
      addLog("✅ Key generated successfully");
      
      // Step 2: Export the key
      addLog("Exporting key...");
      const keyStr = await exportKey(key);
      setExportedKey(keyStr);
      addLog(`✅ Key exported successfully (${keyStr.length} chars)`);
      addLog(`Key: ${keyStr}`);
      
      // Step 3: Encrypt a message
      addLog("Encrypting message...");
      const encrypted = await encryptMessage(originalMessage, key);
      setEncryptedMessage(encrypted);
      addLog(`✅ Message encrypted successfully (${encrypted.length} chars)`);
      
      // Step 4: Generate a test URL
      const id = "test-id-123";
      const testUrl = `${window.location.origin}/view/${id}#${keyStr}`;
      setTestUrl(testUrl);
      addLog(`✅ Test URL created: ${testUrl}`);
      
      // Step 5: Extract key from URL
      const hashFragment = testUrl.split('#')[1];
      setKeyFromUrl(hashFragment);
      addLog(`✅ Key extracted from URL: ${hashFragment}`);
      
      // Step 6: Import the key back
      addLog("Importing key from string...");
      const importedKey = await importKey(hashFragment);
      setImportedKey(importedKey);
      addLog("✅ Key imported successfully");
      
      // Step 7: Decrypt the message
      addLog("Decrypting message...");
      const decrypted = await decryptMessage(encrypted, importedKey);
      setDecryptedMessage(decrypted);
      addLog(`✅ Message decrypted successfully: "${decrypted}"`);
      
      // Step 8: Verify
      if (decrypted === originalMessage) {
        addLog("✅ FULL TEST PASSED: Original and decrypted messages match!");
      } else {
        addLog("❌ TEST FAILED: Original and decrypted messages do not match");
        addLog(`Original: "${originalMessage}"`);
        addLog(`Decrypted: "${decrypted}"`);
      }
    } catch (error) {
      console.error("Test failed:", error);
      if (error instanceof Error) {
        addLog(`❌ TEST ERROR: ${error.message}`);
      } else {
        addLog(`❌ TEST ERROR: Unknown error occurred`);
      }
    }
  };
  
  return (
    <div className="glass-card p-6 md:p-8 w-full max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Encryption/Decryption Tester</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Test Message</label>
          <Textarea 
            value={originalMessage} 
            onChange={(e) => setOriginalMessage(e.target.value)}
            placeholder="Enter a test message"
            className="glass-input"
          />
        </div>
        
        <div className="flex justify-between">
          <Button onClick={runFullTest} className="w-full">
            Run Complete Test
          </Button>
          <Button onClick={clearLogs} variant="outline" className="ml-2">
            Clear Logs
          </Button>
        </div>
        
        <Separator className="my-4" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-3 bg-white/50">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium">Exported Key</h3>
              {exportedKey && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 w-7 p-0" 
                  onClick={() => copyToClipboard(exportedKey, "Key")}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <div className="text-xs font-mono overflow-auto max-h-20 break-all bg-gray-50 p-2 rounded">
              {exportedKey || "No key generated yet"}
            </div>
          </Card>
          
          <Card className="p-3 bg-white/50">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium">Encrypted Message</h3>
              {encryptedMessage && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 w-7 p-0" 
                  onClick={() => copyToClipboard(encryptedMessage, "Encrypted message")}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <div className="text-xs font-mono overflow-auto max-h-20 break-all bg-gray-50 p-2 rounded">
              {encryptedMessage || "No message encrypted yet"}
            </div>
          </Card>
          
          <Card className="p-3 bg-white/50">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium">Test URL</h3>
              {testUrl && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 w-7 p-0" 
                  onClick={() => copyToClipboard(testUrl, "Test URL")}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <div className="text-xs font-mono overflow-auto max-h-20 break-all bg-gray-50 p-2 rounded">
              {testUrl || "No test URL generated yet"}
            </div>
            {keyFromUrl && (
              <>
                <div className="flex justify-center my-1">
                  <ArrowDown className="h-3 w-3" />
                </div>
                <div className="text-xs font-mono overflow-auto max-h-20 break-all bg-gray-50 p-2 rounded">
                  <span className="text-gray-500">Key from URL:</span> {keyFromUrl}
                </div>
              </>
            )}
          </Card>
          
          <Card className="p-3 bg-white/50">
            <h3 className="text-sm font-medium mb-2">Decrypted Result</h3>
            <div className="text-xs font-mono overflow-auto max-h-20 whitespace-pre-wrap bg-gray-50 p-2 rounded">
              {decryptedMessage || "No message decrypted yet"}
            </div>
          </Card>
        </div>
        
        <Card className="p-3 bg-black/5">
          <h3 className="text-sm font-medium mb-2">Test Logs</h3>
          <div className="text-xs font-mono h-60 overflow-auto bg-white p-2 rounded">
            {logs.length > 0 ? logs.map((log, i) => (
              <div key={i} className={log.includes('❌') ? 'text-red-600' : ''}>
                {log}
              </div>
            )) : "Run a test to see logs"}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EncryptionTester;
