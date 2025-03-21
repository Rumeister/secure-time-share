
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
    true, // Make sure keys are extractable
    ["encrypt", "decrypt"]
  );
};

// Properly base64 encode with URL safety
const base64UrlEncode = (arrayBuffer: ArrayBuffer): string => {
  const base64 = btoa(ab2str(arrayBuffer));
  // Make base64 URL-safe
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

// Properly decode URL-safe base64
const base64UrlDecode = (base64Url: string): ArrayBuffer => {
  // Add padding if needed
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  
  try {
    return str2ab(atob(base64));
  } catch (error) {
    console.error("Base64 decoding error:", error);
    throw new Error("Invalid base64 format");
  }
};

// Export the key to base64 string for sharing
export const exportKey = async (key: CryptoKey): Promise<string> => {
  try {
    const exported = await window.crypto.subtle.exportKey("raw", key);
    // Use URL-safe base64 encoding
    return base64UrlEncode(exported);
  } catch (error) {
    console.error("Error exporting key:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to export key: ${error.message}`);
    } else {
      throw new Error("Failed to export key");
    }
  }
};

// Import a key from base64 string
export const importKey = async (keyStr: string): Promise<CryptoKey> => {
  try {
    console.log("Importing key, input length:", keyStr.length);
    
    // Make sure to trim any whitespace from the key
    const trimmedKeyStr = keyStr.trim();
    console.log("After trimming, length:", trimmedKeyStr.length);
    
    // Decode the URL-safe base64 key
    const keyBuffer = base64UrlDecode(trimmedKeyStr);
    console.log("Decoded key buffer length:", keyBuffer.byteLength);
    
    // Check that the key length is correct for AES-256 (32 bytes)
    if (keyBuffer.byteLength !== 32) {
      console.error(`Invalid key length: ${keyBuffer.byteLength} bytes (expected 32 bytes)`);
      throw new Error(`Invalid key length: ${keyBuffer.byteLength} bytes`);
    }
    
    return window.crypto.subtle.importKey(
      "raw",
      keyBuffer,
      {
        name: "AES-GCM",
        length: 256,
      },
      true, // Make sure imported keys are extractable
      ["encrypt", "decrypt"]
    );
  } catch (error) {
    console.error("Error importing key:", error);
    if (error instanceof Error) {
      throw new Error(`Invalid encryption key format: ${error.message}`);
    } else {
      throw new Error("Invalid encryption key format");
    }
  }
};

// Generate a secure salt for key derivation
const generateSalt = (): Uint8Array => {
  return window.crypto.getRandomValues(new Uint8Array(16));
};

// Derive a key using PBKDF2 (inspired by Signal's key derivation)
const deriveKey = async (baseKey: CryptoKey, salt: Uint8Array): Promise<CryptoKey> => {
  try {
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
      true, // Make derived keys extractable
      ["encrypt", "decrypt"]
    );
  } catch (error) {
    console.error("Key derivation error:", error);
    if (error instanceof Error) {
      throw new Error(`Key derivation failed: ${error.message}`);
    } else {
      throw new Error("Key derivation failed");
    }
  }
};

// Encrypt a message with forward secrecy concept
export const encryptMessage = async (message: string, key: CryptoKey): Promise<string> => {
  try {
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
    
    // Return as URL-safe base64 string
    return base64UrlEncode(combined.buffer);
  } catch (error) {
    console.error("Encryption error:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to encrypt message: ${error.message}`);
    } else {
      throw new Error("Failed to encrypt message");
    }
  }
};

// Decrypt a message with forward secrecy
export const decryptMessage = async (encryptedMessage: string, key: CryptoKey): Promise<string> => {
  try {
    console.log("Decrypting message, input length:", encryptedMessage.length);
    
    // Make sure to trim any whitespace
    const trimmedMessage = encryptedMessage.trim();
    console.log("After trimming, length:", trimmedMessage.length);
    
    // Decode the base64 message
    const combined = base64UrlDecode(trimmedMessage);
    console.log("Decoded combined buffer length:", combined.byteLength);
    
    // Check minimum expected length (16 bytes salt + 12 bytes IV + at least some ciphertext)
    if (combined.byteLength < 28) {
      console.error(`Invalid message length: ${combined.byteLength} bytes (expected at least 28 bytes)`);
      throw new Error("Invalid message format - message is too short");
    }
    
    // Extract salt, IV and ciphertext
    const salt = new Uint8Array(combined.slice(0, 16));
    const iv = new Uint8Array(combined.slice(16, 28));
    const ciphertext = new Uint8Array(combined.slice(28));
    
    // Validate components
    if (salt.length !== 16) {
      console.error(`Invalid salt length: ${salt.length}`);
      throw new Error("Invalid message format - incorrect salt length");
    }
    
    if (iv.length !== 12) {
      console.error(`Invalid IV length: ${iv.length}`);
      throw new Error("Invalid message format - incorrect IV length");
    }
    
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
    if (error instanceof Error) {
      throw new Error(`Failed to decrypt the message: ${error.message}`);
    } else {
      throw new Error("Failed to decrypt the message");
    }
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

