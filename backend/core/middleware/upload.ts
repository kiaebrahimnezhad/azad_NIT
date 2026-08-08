// middleware/upload.ts
import multer from 'multer';
import path   from 'path';
import fs     from 'fs';

const dir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

export const upload = multer({
  storage: multer.diskStorage({
    destination: (_, __, cb) => cb(null, dir),
    filename:    (_, file, cb) =>
      cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '')}`)
  }),
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});
