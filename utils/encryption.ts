const SYSTEM_KEY = "TAKI_OS_SECURE_V3_X99";

export const encryptData = (data: any): string => {
  try {
    if (data === undefined || data === null) return "";
    
    // 1. Convert JSON to String
    const jsonString = JSON.stringify(data);
    
    // 2. Base64 Encode (to handle Unicode/Arabic correctly)
    const base64 = btoa(unescape(encodeURIComponent(jsonString)));
    
    // 3. XOR Cipher (Mix with SYSTEM_KEY)
    let result = '';
    for (let i = 0; i < base64.length; i++) {
      result += String.fromCharCode(base64.charCodeAt(i) ^ SYSTEM_KEY.charCodeAt(i % SYSTEM_KEY.length));
    }
    
    // 4. Wrap with identifier and final encoding
    return 'ENC::' + btoa(result);
  } catch (error) {
    console.error("TAKI GUARD: Encryption Error", error);
    return "";
  }
};

export const decryptData = (encryptedString: string | null, fallbackValue: any): any => {
  if (!encryptedString) return fallbackValue;

  try {
    // --- MIGRATION LOGIC ---
    // If data doesn't start with 'ENC::', assume it is old legacy data (plain JSON)
    if (!encryptedString.startsWith('ENC::')) {
       try {
         return JSON.parse(encryptedString);
       } catch {
         return fallbackValue;
       }
    }

    // --- DECRYPTION LOGIC ---
    // 1. Strip prefix and decode outer layer
    const raw = atob(encryptedString.replace('ENC::', ''));
    
    // 2. XOR Decipher (Reverse Mix)
    let base64 = '';
    for (let i = 0; i < raw.length; i++) {
      base64 += String.fromCharCode(raw.charCodeAt(i) ^ SYSTEM_KEY.charCodeAt(i % SYSTEM_KEY.length));
    }
    
    // 3. Decode Base64 and Parse JSON
    const jsonString = decodeURIComponent(escape(window.atob(base64)));
    return JSON.parse(jsonString);

  } catch (error) {
    console.error("TAKI GUARD: Decryption Failed (Data might be corrupted)", error);
    return fallbackValue;
  }
};