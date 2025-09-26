import { join } from 'path';

export const getPublicPath = () => {
  return join(process.cwd(), 'public');
};

export const getUploadPath = () => {
  return join(getPublicPath(), 'uploads');
};

export const getPublicUrl = (fileName: string) => {
  // Remove 'public' from the path as it's automatically served
  return `/uploads/${fileName}`;
};

export const normalizeFilePath = (path: string) => {
  return path.replace(/\\/g, '/');
};