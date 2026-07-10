import multer from 'multer';
import streamifier from 'streamifier';
import cloudinary from '../config/cloudinary.js';

// Keep uploaded files in memory (not on disk) - we stream them straight to Cloudinary
const storage = multer.memoryStorage();

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per image

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(new Error('Only JPG, PNG and WEBP images are allowed.'));
    }
    cb(null, true);
  },
});

// Streams a single file buffer to Cloudinary and resolves with { url, publicId }
export function uploadBufferToCloudinary(buffer, folder = 'ecovillage/hotels') {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}
