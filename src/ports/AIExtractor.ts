import { ExtractedFields } from "../domain/models";

export interface AIExtractor {
  extractFromImage(imageUri: string): Promise<ExtractedFields>;
  extractFromText(narration: string): Promise<ExtractedFields>;
}
