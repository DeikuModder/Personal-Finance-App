import { Observable } from 'rxjs';

export interface PictureResult {
  dataUrl: string;
  width: number;
  height: number;
}

export class PictureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PictureError';
  }
}

const MAX_SIZE = 900;
const JPEG_QUALITY = 0.8;
const MAX_FILE_MB = 25;

function fileSizeMb(file: File): string {
  return (file.size / 1048576).toFixed(1);
}

function isHeic(file: File): boolean {
  return /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
}

/**
 * Reads an image file, scales it down and returns a compact JPEG data URL.
 * Emits `PictureResult` on success and throws `PictureError` with a
 * human-readable message when the file can't be processed.
 */
export function fileToPicture(file: File): Observable<PictureResult> {
  return new Observable((subscriber) => {
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      subscriber.error(
        new PictureError(
          `"${file.name}" is ${fileSizeMb(file)} MB. Photos over ${MAX_FILE_MB} MB can't be processed — pick a smaller one.`
        )
      );
      return;
    }

    const heic = isHeic(file);
    const reader = new FileReader();

    reader.onerror = () => {
      subscriber.error(new PictureError(`Couldn't read "${file.name}". Please try again.`));
    };

    reader.onload = () => {
      const img = new Image();

      img.onerror = () => {
        subscriber.error(
          heic
            ? `This photo is HEIC (iPhone's default format) and your device couldn't read it. On the iPhone enable Settings → Photos → "Most Compatible", then choose the photo again — or pick a JPG/PNG.`
            : `"${file.name}" doesn't look like a valid image. Try a JPG or PNG photo.`
        );
      };

      img.onload = () => {
        try {
          if (!img.naturalWidth || !img.naturalHeight) {
            throw new PictureError('This image has no readable dimensions.');
          }

          const scale = Math.min(1, MAX_SIZE / Math.max(img.naturalWidth, img.naturalHeight));
          const width = Math.max(1, Math.round(img.naturalWidth * scale));
          const height = Math.max(1, Math.round(img.naturalHeight * scale));

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new PictureError("Your browser refused to process this image. Try another photo.");
          }

          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
          if (!dataUrl.startsWith('data:image/jpeg') || dataUrl.length < 64) {
            throw new PictureError(
              heic
                ? `That photo is in HEIC format and couldn't be converted on this device. On your iPhone enable Settings → Photos → "Most Compatible" and try again, or use a JPG/PNG.`
                : 'The image could not be converted. Try a different photo.'
            );
          }

          subscriber.next({ dataUrl, width, height });
          subscriber.complete();
        } catch (e) {
          subscriber.error(
            e instanceof PictureError ? e : new PictureError('Something went wrong reading that image. Try a JPG/PNG photo.')
          );
        }
      };

      img.src = String(reader.result);
    };

    reader.readAsDataURL(file);
  });
}