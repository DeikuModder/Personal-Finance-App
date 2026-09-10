import { BehaviorSubject, Observable } from 'rxjs';

export interface PictureResult {
  dataUrl: string;
  width: number;
  height: number;
}

const MAX_SIZE = 900;
const JPEG_QUALITY = 0.8;

export function fileToPicture(file: File): Observable<PictureResult | null> {
  const result$ = new BehaviorSubject<PictureResult | null>(null);
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      const scale = Math.min(1, MAX_SIZE / Math.max(width, height));
      width = Math.round(width * scale);
      height = Math.round(height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        result$.next(null);
        result$.complete();
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      result$.next({ dataUrl: canvas.toDataURL('image/jpeg', JPEG_QUALITY), width, height });
      result$.complete();
    };
    img.onerror = () => {
      result$.next(null);
      result$.complete();
    };
    img.src = String(reader.result);
  };
  reader.onerror = () => {
    result$.next(null);
    result$.complete();
  };
  reader.readAsDataURL(file);
  return result$;
}