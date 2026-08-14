const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

// Check if Cloudinary is configured
const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Ensure local uploads directory exists
const localUploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(localUploadsDir)) {
  fs.mkdirSync(localUploadsDir, { recursive: true });
}

// Multer disk storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, localUploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter (images and videos only)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif|mp4|webm|mkv|mov/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only images (jpg, png, webp, gif) and videos (mp4, webm, mkv) are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 50 // 50MB max file size
  }
});

/**
 * Uploads a file (either local fallback or Cloudinary) and returns URLs
 */
async function uploadToCloudinaryOrLocal(filePath, folder = 'bgmi_esports') {
  if (isCloudinaryConfigured) {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: folder,
        resource_type: 'auto'
      });
      // Delete temporary local file after uploading to Cloudinary
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return {
        url: result.secure_url,
        thumbnailUrl: result.secure_url.replace('/upload/', '/upload/c_thumb,w_200/'),
        publicId: result.public_id
      };
    } catch (error) {
      console.error('Cloudinary Upload Failed, using local fallback:', error.message);
    }
  }

  // Local fallback: Return relative URL path so frontend can resolve against backend origin dynamically
  const filename = path.basename(filePath);
  const relativeUrl = `/uploads/${filename}`;
  return {
    url: relativeUrl,
    thumbnailUrl: relativeUrl,
    publicId: filename
  };
}

module.exports = {
  upload,
  uploadToCloudinaryOrLocal
};
