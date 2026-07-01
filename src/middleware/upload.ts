import path from 'path';
import fs from 'fs';
import { writeFile } from 'fs/promises';

export const saveUploadFile = async (file: File): Promise<string> => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
  const ext = path.extname(file.name).toLowerCase();

  if (!allowedExtensions.includes(ext)) {
    throw new Error('Only JPG, PNG, and PDF files are allowed!');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File size exceeds 5 MB limit!');
  }

  const uploadDir = path.join(process.cwd(), 'public/uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const filename = `file-${uniqueSuffix}${ext}`;
  const filepath = path.join(uploadDir, filename);

  await writeFile(filepath, buffer);

  // Return the public URL path
  return `/uploads/${filename}`;
};
