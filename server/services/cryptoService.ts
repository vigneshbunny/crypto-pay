
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.DATABASE_URL || 'default-key-change-in-production';
const ALGORITHM = 'aes-256-gcm';

export class CryptoService {
  static encrypt(text: string): string {
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes256', key);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  static decrypt(encryptedData: string): string {
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const parts = encryptedData.split(':');
    
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipher('aes256', key);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  static hashPassword(password: string): string {
    return crypto.pbkdf2Sync(password, 'salt', 10000, 64, 'sha256').toString('hex');
  }

  static verifyPassword(password: string, hash: string): boolean {
    const hashVerify = crypto.pbkdf2Sync(password, 'salt', 10000, 64, 'sha256').toString('hex');
    return hash === hashVerify;
  }
}
