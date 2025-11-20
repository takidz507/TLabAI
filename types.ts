export interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

export interface Position {
  x: number;
  y: number;
}

export type Theme = 'dark' | 'light';

export interface SearchParams {
  query: string;
}

export interface PdfFile {
  name: string;
  data: string; // Base64
  url: string; // Blob URL
}

export interface VideoFile {
  type: 'youtube' | 'local';
  id?: string; // For YouTube
  url: string; // Blob URL or YouTube URL
  name: string;
  data?: string; // Base64 for local files (for AI analysis)
  mimeType?: string;
}