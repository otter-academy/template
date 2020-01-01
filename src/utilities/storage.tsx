/**
 * An asynchronous key-value store of strings.
 */
export interface StringStorage {
  /**
   * Returns a boolean indicating whether there is a value with the specified key.
   */
  has(key: string): Promise<boolean>;
  /**
   * Returns the value stored under the specified key, or undefined.
   */
  get(key: string): Promise<string | undefined>;
  /**
   * Sets the value stored under a specified key, returning the previous value or undefined.
   */
  set(key: string, value: string): Promise<string | undefined>;
  /**
   * Deletes the value stored under a specified key there is any, returning it or undefined.
   */
  delete(key: string): Promise<string | undefined>;
}

/**
 * The browser's built in synchronous string storage.
 */
class SyncStorage implements StringStorage {
  readonly storage: Storage;

  constructor(storage: Storage) {
    this.storage = storage;
  }

  async has(key: string) {
    return this.storage.getItem(key) !== null;
  }

  async get(key: string) {
    return this.storage.getItem(key) ?? undefined;
  }

  async set(key: string, value: string) {
    const former = this.get(key);
    this.storage.setItem(key, value);
    return former;
  }

  async delete(key: string) {
    const former = this.get(key);
    this.storage.removeItem(key);
    return former;
  }
}

/**
 * Our own remote storage service. Not implemented.
 */
class RemoteStorage implements RemoteStorage {
  static async new() {
    const password = "example@example.com\n3example22";

    const privateKeyBuffer = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        hash: "SHA-512",
        salt: new Uint8Array(),
        iterations: 1 << 16
      },
      await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        "PBKDF2",
        true,
        ["deriveBits"]
      ),
      128
    );

    const publicKeyBuffer = await crypto.subtle
      .digest("SHA-512", privateKeyBuffer)
      .then((digest) => digest.slice(0, 128 / 8));

    const toHex = (buffer: ArrayBuffer): string => {
      const byteToHex = new Array(0x100);
      for (let i = 0; i <= 0xff; ++i) {
        byteToHex[i] = i.toString(16).padStart(2, "0");
      }
      const bufferBytes = new Uint8Array(buffer);
      const hexOctets = Array(bufferBytes.length);
      for (let i = 0; i < bufferBytes.length; ++i) {
        hexOctets[i] = byteToHex[bufferBytes[i]];
      }
      return hexOctets.join("");
    };

    const privateKey = toHex(privateKeyBuffer);
    const publicKey = toHex(publicKeyBuffer);

    console.log({ password, privateKey, publicKey });
  }

  async has(_key: string) {
    return false;
  }

  async get(_key: string) {
    return undefined;
  }

  async set(_key: string, _value: string): Promise<string> {
    throw new Error("not implemented");
  }

  async delete() {
    return undefined;
  }
}

export const session: StringStorage = new SyncStorage(window.sessionStorage);
export const local: StringStorage = new SyncStorage(window.localStorage);
export const remote: RemoteStorage = new RemoteStorage();
