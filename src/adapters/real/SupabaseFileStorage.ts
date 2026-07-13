import { File } from "expo-file-system";
import { FileStorage } from "../../ports/FileStorage";
import { getSupabase } from "./supabaseClient";

const BUCKET = "receipts";

/**
 * Real object storage via a private Supabase Storage bucket. Keys are
 * expected as "<userId>/<filename>" so the storage.objects RLS policy
 * (first path segment = auth.uid()) actually applies — see
 * supabase/migrations/20260713000000_init.sql.
 */
export class SupabaseFileStorage implements FileStorage {
  async upload(localUri: string, key: string): Promise<string> {
    const bytes = new File(localUri).bytesSync();
    const { error } = await getSupabase()
      .storage.from(BUCKET)
      .upload(key, bytes, { upsert: true, contentType: "image/jpeg" });
    if (error) throw error;
    return key;
  }

  async getUrl(key: string): Promise<string> {
    const { data, error } = await getSupabase()
      .storage.from(BUCKET)
      .createSignedUrl(key, 60 * 60);
    if (error) throw error;
    return data.signedUrl;
  }

  async delete(key: string): Promise<void> {
    const { error } = await getSupabase().storage.from(BUCKET).remove([key]);
    if (error) throw error;
  }
}
