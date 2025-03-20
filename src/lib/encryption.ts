
/**
 * Enhanced encryption utility inspired by Signal Protocol concepts
 * Using Web Crypto API with additional security layers
 */

// Convert string to ArrayBuffer
const str2ab = (str: string): ArrayBuffer => {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0; i < str.length; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
};

// Convert ArrayBuffer to string
const ab2str = (buf: ArrayBuffer): string => {
  return String.fromCharCode.apply(null, Array.from(new Uint8Array(buf)));
};

// Generate initialization vector
const generateIV = (): Uint8Array => {
  return window.crypto.getRandomValues(new Uint8Array(12));
};

// Generate a random encryption key with enhanced security
export const generateKey = async (): Promise<CryptoKey> => {
  // Use AES-GCM with 256-bit keys for strong encryption
  return window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256, // Use 256-bit keys for stronger encryption
    },
    true,
    ["encrypt", "decrypt"]
  );
};

// Export the key to base64 string for sharing
export const exportKey = async (key: CryptoKey): Promise<string> => {
  const exported = await window.crypto.subtle.exportKey("raw", key);
  return btoa(ab2str(exported));
};

// Import a key from base64 string
export const importKey = async (keyStr: string): Promise<CryptoKey> => {
  const keyBuffer = str2ab(atob(keyStr));
  return window.crypto.subtle.importKey(
    "raw",
    keyBuffer,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"]
  );
};

// Generate a secure salt for key derivation
const generateSalt = (): Uint8Array => {
  return window.crypto.getRandomValues(new Uint8Array(16));
};

// Derive a key using PBKDF2 (inspired by Signal's key derivation)
const deriveKey = async (baseKey: CryptoKey, salt: Uint8Array): Promise<CryptoKey> => {
  const keyMaterial = await window.crypto.subtle.exportKey("raw", baseKey);
  
  // Import as key material for derivation
  const importedKeyMaterial = await window.crypto.subtle.importKey(
    "raw",
    keyMaterial,
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  
  // Derive a new key using PBKDF2
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    importedKeyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

// Encrypt a message with forward secrecy concept
export const encryptMessage = async (message: string, key: CryptoKey): Promise<string> => {
  // Generate random salt and IV for this message
  const salt = generateSalt();
  const iv = generateIV();
  
  // Derive a unique message key (similar to Signal's message keys)
  const messageKey = await deriveKey(key, salt);
  
  // Encode the message
  const encoded = new TextEncoder().encode(message);
  
  // Encrypt with the derived key
  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    messageKey,
    encoded
  );
  
  // Combine salt, IV and ciphertext for storage
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  combined.set(salt);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);
  
  // Return as base64 string
  return btoa(ab2str(combined.buffer));
};

// Decrypt a message with forward secrecy
export const decryptMessage = async (encryptedMessage: string, key: CryptoKey): Promise<string> => {
  try {
    const combined = str2ab(atob(encryptedMessage));
    
    // Extract salt, IV and ciphertext
    const salt = new Uint8Array(combined.slice(0, 16));
    const iv = new Uint8Array(combined.slice(16, 28));
    const ciphertext = new Uint8Array(combined.slice(28));
    
    // Derive the same message key using the provided salt
    const messageKey = await deriveKey(key, salt);
    
    // Decrypt with the derived key
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
      },
      messageKey,
      ciphertext
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt the message. The key may be incorrect.");
  }
};

// Generate a secure token for URL
export const generateToken = (): string => {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
};
