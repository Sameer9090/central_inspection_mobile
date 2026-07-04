import CryptoJS from "crypto-js";

const NONCE = "nonce_value";

class Encryption {
  get encryptMethod() {
    return "AES-256-CBC";
  }

  get encryptMethodLength() {
    return parseInt(this.encryptMethod.match(/\d+/)![0]);
  }

  encrypt(string: string, key: string): string {
    const iv = CryptoJS.lib.WordArray.random(16);

    const salt = CryptoJS.lib.WordArray.random(256);

    const iterations = 999;

    const encryptMethodLength = this.encryptMethodLength / 4;

    const hashKey = CryptoJS.PBKDF2(key, salt, {
      hasher: CryptoJS.algo.SHA512,
      keySize: encryptMethodLength / 8,
      iterations,
    });

    const encrypted = CryptoJS.AES.encrypt(string, hashKey, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    const encryptedString = CryptoJS.enc.Base64.stringify(
      encrypted.ciphertext
    );

    const output = {
      ciphertext: encryptedString,
      iv: CryptoJS.enc.Hex.stringify(iv),
      salt: CryptoJS.enc.Hex.stringify(salt),
      iterations,
    };

    return CryptoJS.enc.Base64.stringify(
      CryptoJS.enc.Utf8.parse(JSON.stringify(output))
    );
  }
}

export const encryptPassword = (password: string) => {
  const encryption = new Encryption();
  return encryption.encrypt(password, NONCE);
};