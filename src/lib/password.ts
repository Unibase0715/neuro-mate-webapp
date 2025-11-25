// Use Web Crypto API for password hashing (compatible with Cloudflare Workers)

async function getPasswordKey(password: string) {
  const encoder = new TextEncoder();
  return await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const passwordKey = await getPasswordKey(password);
  
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  
  const keyBuffer = await crypto.subtle.exportKey('raw', derivedKey);
  const keyArray = Array.from(new Uint8Array(keyBuffer));
  const saltArray = Array.from(salt);
  
  // Combine salt and key, then encode as base64
  const combined = [...saltArray, ...keyArray];
  return btoa(String.fromCharCode(...combined));
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    // Decode base64 hash
    const combined = Uint8Array.from(atob(hash), c => c.charCodeAt(0));
    const salt = combined.slice(0, 16);
    const storedKey = combined.slice(16);
    
    const passwordKey = await getPasswordKey(password);
    
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    
    const keyBuffer = await crypto.subtle.exportKey('raw', derivedKey);
    const keyArray = new Uint8Array(keyBuffer);
    
    // Compare keys
    if (keyArray.length !== storedKey.length) return false;
    
    for (let i = 0; i < keyArray.length; i++) {
      if (keyArray[i] !== storedKey[i]) return false;
    }
    
    return true;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}
