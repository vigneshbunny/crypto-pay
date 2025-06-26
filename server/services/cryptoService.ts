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
      // Input validation
      if (!encryptedData || typeof encryptedData !== "string") {
        throw new Error("Invalid encrypted data input");
      }

      const key = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
      const parts = encryptedData.split(":");

      console.log(`Decrypting data with ${parts.length} parts`);
      console.log(
        "Parts lengths:",
        parts.map((p) => p.length),
      );

      let iv: Buffer;
      let encrypted: string;

      // Handle different formats based on the number of parts
      if (parts.length === 2) {
        // Standard format: iv:encrypted
        console.log("Using 2-part format");
        iv = Buffer.from(parts[0], "hex");
        encrypted = parts[1];
      } else if (parts.length === 3) {
        // Legacy format: iv:part1:part2 (combine part1 + part2)
        console.log("Using 3-part format");
        iv = Buffer.from(parts[0], "hex");
        encrypted = parts[1] + parts[2];
      } else {
        console.error(`Invalid format: ${parts.length} parts`);
        throw new Error(
          `Invalid encrypted data format - got ${parts.length} parts`,
        );
      }

      // Validate IV and encrypted data
      if (iv.length !== 16) {
        throw new Error(`Invalid IV length: ${iv.length}, expected 16 bytes`);
      }

      if (encrypted.length % 2 !== 0) {
        throw new Error("Invalid encrypted data - not valid hex string");
      }

      console.log(
        `IV length: ${iv.length}, Encrypted length: ${encrypted.length}`,
      );

      // Perform decryption
      const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");

      console.log("Decryption successful");
      return decrypted;
    } catch (error) {
      console.error("Decryption failed:", error);
      console.error("Input data:", encryptedData);

      if (error instanceof Error) {
        // Check for common decryption errors
        if (
          error.message.includes("wrong final block length") ||
          error.message.includes("bad decrypt")
        ) {
          console.error("LIKELY CAUSE: Wrong encryption key or corrupted data");
          throw new Error("Decryption failed - check encryption key");
        }
      }

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

  // Test function for your specific wallet data
  static testActualWallets(): void {
    console.log("=== TESTING ACTUAL WALLET DATA ===");

    // Your actual wallet data from wallets.json
    const testWallets = [
      {
        id: 1,
        encrypted:
          "65a774105e6b3ac2d78a93adbd9cbc4f:af40f4a32fd292eb1826b43ad201c97b:6bf4b3eac7a63cf4fa72cd20c66f387095b14c43030821e2e9d1b2800c52132ce97d4d8fa9052d2213ba2c6315baac3188bdcb68d0a9d5d6f22208a0790570bf",
      },
      {
        id: 2,
        encrypted:
          "68f479773e8ca09decb0187f3385e60e:0fa0d53b01d93fa9e4652f8d2b8fbe3732cbe0cc9cb67c5066b405358f7afe4d08df30df6160c5789ad5497ce317294fe6020cf5651d67af9e29e43410485d5417665d3e471cf49be28062f3d0f0edd9",
      },
    ];

    testWallets.forEach((wallet) => {
      console.log(`\nTesting Wallet ${wallet.id}:`);
      try {
        const decrypted = this.decrypt(wallet.encrypted);
        console.log(`✅ Wallet ${wallet.id} decryption: SUCCESS`);
        console.log(`Decrypted private key length: ${decrypted.length}`);
        // Don't log the actual private key for security
      } catch (error) {
        console.log(`❌ Wallet ${wallet.id} decryption: FAILED`);
        console.error(error instanceof Error ? error.message : error);
      }
    });

    console.log("=== TEST COMPLETE ===");
  }

  // Quick encryption/decryption test
  static testEncryptionCycle(): boolean {
    try {
      console.log("Testing encryption/decryption cycle...");
      const testData = "test-private-key-12345";
      const encrypted = this.encrypt(testData);
      const decrypted = this.decrypt(encrypted);
      const success = testData === decrypted;
      console.log(`Encryption cycle test: ${success ? "PASSED" : "FAILED"}`);
      return success;
    } catch (error) {
      console.error("Encryption cycle test failed:", error);
      return false;
    }
  }
}
