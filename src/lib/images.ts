import * as ImageManipulator from 'expo-image-manipulator';
// The classic FileSystem API (documentDirectory, copyAsync, makeDirectoryAsync)
// moved to the /legacy entrypoint in expo-file-system 19.
import * as FileSystem from 'expo-file-system/legacy';

import { diag } from './diagnostics';
import type { IdentifiedBottle } from './claude';

const BOTTLE_DIR = FileSystem.documentDirectory + 'bottles/';

/** Ensure our per-bottle image directory exists. */
async function ensureDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(BOTTLE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(BOTTLE_DIR, { intermediates: true });
  }
}

/**
 * Persist a manipulator result (a cache-dir file) into permanent app storage so
 * it survives restarts, and return its stable file:// URI. Falls back to the
 * source URI if the copy fails for any reason.
 */
async function persist(id: string, sourceUri: string): Promise<string> {
  try {
    await ensureDir();
    const dest = `${BOTTLE_DIR}${id}.jpg`;
    // Overwrite any prior crop for this id.
    await FileSystem.deleteAsync(dest, { idempotent: true }).catch(() => {});
    await FileSystem.copyAsync({ from: sourceUri, to: dest });
    return dest;
  } catch (err) {
    diag.warn('images', `persist failed, using temp uri: ${(err as Error).message}`);
    return sourceUri;
  }
}

/** Convert a padded percentage box → integer pixel rect clamped to the image. */
function boxToRect(
  box: NonNullable<IdentifiedBottle['box']>,
  imgW: number,
  imgH: number
): { originX: number; originY: number; width: number; height: number } | undefined {
  // Pad the AI's box a touch so we don't shave the bottle's edges.
  const pad = 4;
  const x = Math.max(0, box.x - pad);
  const y = Math.max(0, box.y - pad);
  const w = Math.min(100 - x, box.w + pad * 2);
  const h = Math.min(100 - y, box.h + pad * 2);

  const originX = Math.round((x / 100) * imgW);
  const originY = Math.round((y / 100) * imgH);
  const width = Math.round((w / 100) * imgW);
  const height = Math.round((h / 100) * imgH);
  if (width < 8 || height < 8) return undefined;
  return { originX, originY, width, height };
}

/**
 * Crop a single bottle out of a shelf photo using its percentage bounding box,
 * compress it, and persist it. Returns a stable file URI, or undefined if the
 * box is missing/unusable so callers can fall back to a crest placeholder.
 */
export async function cropBottle(
  id: string,
  photoUri: string,
  imgW: number,
  imgH: number,
  box: IdentifiedBottle['box']
): Promise<string | undefined> {
  if (!box || !imgW || !imgH) return undefined;
  const rect = boxToRect(box, imgW, imgH);
  if (!rect) return undefined;
  try {
    const out = await ImageManipulator.manipulateAsync(photoUri, [{ crop: rect }], {
      compress: 0.7,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    return await persist(id, out.uri);
  } catch (err) {
    diag.warn('images', `crop failed for ${id}: ${(err as Error).message}`);
    return undefined;
  }
}

/**
 * Persist a whole photo (e.g. a single-bottle label shot) as this bottle's
 * image, downscaling it so we don't store a full-res camera frame per bottle.
 */
export async function saveBottlePhoto(id: string, photoUri: string): Promise<string | undefined> {
  try {
    const out = await ImageManipulator.manipulateAsync(photoUri, [{ resize: { width: 900 } }], {
      compress: 0.7,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    return await persist(id, out.uri);
  } catch (err) {
    diag.warn('images', `save photo failed for ${id}: ${(err as Error).message}`);
    return undefined;
  }
}

/** Remove a bottle's stored image (best-effort) when it's deleted. */
export async function deleteBottlePhoto(id: string): Promise<void> {
  await FileSystem.deleteAsync(`${BOTTLE_DIR}${id}.jpg`, { idempotent: true }).catch(() => {});
}
