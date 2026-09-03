export interface ImageFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string; // Blob URL for local display
  width: number;
  height: number;
}

export type PageSize = 'a4' | 'letter' | 'fit';

export type PageOrientation = 'portrait' | 'landscape' | 'auto';

export type MarginSize = 'none' | 'small' | 'large';

export interface PDFSettings {
  pageSize: PageSize;
  orientation: PageOrientation;
  margin: MarginSize;
  compression: number; // 0.1 to 1.0
  filename: string;
}
