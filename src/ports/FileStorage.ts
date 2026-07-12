export interface FileStorage {
  upload(localUri: string, key: string): Promise<string>;
  getUrl(key: string): Promise<string>;
  delete(key: string): Promise<void>;
}
