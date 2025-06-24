import crypto from "crypto";

const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || "default-key-change-in-production-32b";

export class CryptoService {
  static encrypt(text: string): string {
    try {
      // Create a 32-byte key from the encryption key
      const key = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
      const iv = crypto.randomBytes(16);

      const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
      let encrypted = cipher.update(text, "utf8", "hex");
      encrypted += cipher.final("hex");

      // Return format: iv:encrypted
      return iv.toString("hex") + ":" + encrypted;
    } catch (error) {
      console.error("Encryption error:", error);
      throw new Error("Failed to encrypt data");
    }
  }

  static decrypt(encryptedData: string): string {
    try {
      // Create the same 32-byte key
      const key = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();

      const parts = encryptedData.split(":");

      let iv: Buffer;
      let encrypted: string;

      if (parts.length === 3) {
        // Handle old 3-part format: part1:part2:part3
        // Reconstruct as iv:encrypted by combining parts
        console.log("Handling old 3-part encrypted format");
        iv = Buffer.from(parts[0], "hex");
        encrypted = parts[1] + parts[2]; // Combine the encrypted parts
      } else if (parts.length === 2) {
        // Handle new 2-part format: iv:encrypted
        iv = Buffer.from(parts[0], "hex");
        encrypted = parts[1];
      } else {
        console.error(
          "Invalid encrypted data format. Expected format: iv:encrypted or old 3-part format",
        );
        console.error("Received parts:", parts.length, "Data:", encryptedData);
        throw new Error("Invalid encrypted data format");
      }

      const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      console.error("Decryption error:", error);
      console.error("Encrypted data:", encryptedData);
      throw new Error("Failed to decrypt data");
    }
  }

  static hashPassword(password: string): string {
    return crypto
      .pbkdf2Sync(password, "salt", 10000, 64, "sha256")
      .toString("hex");
  }

  static verifyPassword(password: string, hash: string): boolean {
    const hashVerify = crypto
      .pbkdf2Sync(password, "salt", 10000, 64, "sha256")
      .toString("hex");
    return hash === hashVerify;
  }
}
