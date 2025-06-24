
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32b';

export class CryptoService {
  static encrypt(text: string): string {
    try {
      // Create a 32-byte key from the encryption key
      const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
      const iv = crypto.randomBytes(16);
      
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Return format: iv:encrypted
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  static decrypt(encryptedData: string): string {
    try {
      // Create the same 32-byte key
      const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
      
      const parts = encryptedData.split(':');
      
      if (parts.length !== 2) {
        console.error('Invalid encrypted data format. Expected format: iv:encrypted');
        console.error('Received parts:', parts.length, 'Data:', encryptedData);
        throw new Error('Invalid encrypted data format');
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      console.error('Encrypted data:', encryptedData);
      throw new Error('Failed to decrypt data');
    }
  }

  static hashPassword(password: string): string {
    return crypto.pbkdf2Sync(password, 'salt', 10000, 64, 'sha256').toString('hex');
  }

  static verifyPassword(password: string, hash: string): boolean {
    const hashVerify = crypto.pbkdf2Sync(password, 'salt', 10000, 64, 'sha256').toString('hex');
    return hash === hashVerify;
  }
}
