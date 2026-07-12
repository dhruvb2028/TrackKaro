import { Directory, File, Paths } from "expo-file-system";
import { FileStorage } from "../../ports/FileStorage";

function receiptsDir(): Directory {
  const dir = new Directory(Paths.document, "receipts");
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
  return dir;
}

/**
 * Stores files on-device instead of a real object store (S3/GCS/etc).
 * Same FileStorage interface either way, so swapping later is a new
 * adapter, not a rewrite.
 */
export class LocalFileStorage implements FileStorage {
  async upload(localUri: string, key: string): Promise<string> {
    const source = new File(localUri);
    const dest = new File(receiptsDir(), key);
    await source.copy(dest);
    return dest.uri;
  }

  async getUrl(key: string): Promise<string> {
    return new File(receiptsDir(), key).uri;
  }

  async delete(key: string): Promise<void> {
    const file = new File(receiptsDir(), key);
    if (file.exists) {
      file.delete();
    }
  }
}
