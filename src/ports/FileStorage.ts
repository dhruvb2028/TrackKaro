export interface FileStorage {
  /**
   * Returns a storage reference to persist (e.g. as Expense.receiptImageUri) —
   * NOT necessarily a directly-renderable URL. Local adapters may return a
   * usable file:// URI; a remote adapter backed by a private bucket returns
   * an opaque key. Always resolve through getUrl() before rendering an image.
   */
  upload(localUri: string, key: string): Promise<string>;
  /** Resolves a stored reference (from upload()) to a renderable URL, which may be short-lived (e.g. a signed URL). */
  getUrl(key: string): Promise<string>;
  delete(key: string): Promise<void>;
}
