
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.DATABASE_URL || 'default-key-change-in-production';
const ALGORITHM = 'aes-256-cbc';

export class CryptoService {
  static encrypt(text: string): string {
    try {
      const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  static decrypt(encryptedData: string): string {
    try {
      const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
      const parts = encryptedData.split(':');
      
      if (parts.length !== 2) {
        throw new Error('Invalid encrypted data format');
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
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
