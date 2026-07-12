import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { container } from "../adapters/container";

/**
 * Guest safety net (PRD §8.9): let a user who hasn't signed up pull all their
 * data out as a file, so an uninstall never means silent, total data loss.
 */
export async function exportUserData(userId: string): Promise<void> {
  const expenses = await container.expenseRepository.listForUser(userId);
  const payload = {
    exportedFrom: "TrackKaro",
    schemaVersion: 1,
    expenses,
  };

  const file = new File(Paths.document, "trackkaro-export.json");
  if (file.exists) {
    file.delete();
  }
  file.create();
  file.write(JSON.stringify(payload, null, 2));

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: "application/json",
      dialogTitle: "Export your TrackKaro data",
    });
  }
}
