import sharp from "sharp";

export const maxStoredImageBytes = 1_000_000;

const compressionSteps = [
  { width: 1600, quality: 82 },
  { width: 1600, quality: 70 },
  { width: 1400, quality: 62 },
  { width: 1200, quality: 56 },
  { width: 1000, quality: 50 },
  { width: 800, quality: 44 },
  { width: 640, quality: 38 },
  { width: 480, quality: 32 },
  { width: 320, quality: 28 }
] as const;

export async function compressImageBelowLimit(buffer: Buffer) {
  for (const step of compressionSteps) {
    const compressed = await sharp(buffer, { limitInputPixels: 40_000_000, animated: false })
      .rotate()
      .resize({ width: step.width, withoutEnlargement: true })
      .webp({ quality: step.quality, alphaQuality: step.quality, effort: 4 })
      .toBuffer();
    if (compressed.byteLength < maxStoredImageBytes) return compressed;
  }
  throw new Error("Unable to compress image below the storage limit");
}
