/**
 * Square-crop an image file to a canvas blob (browser only).
 */

export async function cropImageToSquare(
  file: File,
  outputSize: number
): Promise<{ blob: Blob; mimeType: string }> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable.");

  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, outputSize, outputSize);
  bitmap.close();

  const mimeType = file.type === "image/png" ? "image/png" : "image/webp";
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Crop failed."))),
      mimeType,
      0.92
    );
  });

  return { blob, mimeType };
}
