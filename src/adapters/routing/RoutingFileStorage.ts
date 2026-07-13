import { FileStorage } from "../../ports/FileStorage";
import { hasActiveSupabaseSession } from "../real/supabaseClient";

export class RoutingFileStorage implements FileStorage {
  constructor(
    private readonly local: FileStorage,
    private readonly remote: FileStorage | null
  ) {}

  private async active(): Promise<FileStorage> {
    if (this.remote && (await hasActiveSupabaseSession())) return this.remote;
    return this.local;
  }

  async upload(localUri: string, key: string): Promise<string> {
    return (await this.active()).upload(localUri, key);
  }

  async getUrl(key: string): Promise<string> {
    return (await this.active()).getUrl(key);
  }

  async delete(key: string): Promise<void> {
    return (await this.active()).delete(key);
  }
}
