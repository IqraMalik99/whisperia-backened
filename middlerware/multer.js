
// import multer from "multer";

// // Define storage configuration
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, '../public/temp'); // Save files to the ./public/temp directory
//   },
//   filename: function (req, file, cb) {
//     // Retain the original filename
//     cb(null, file.originalname);
//   },
// });

// // Define file filter to accept only specific file types (images, audio, video)
// const fileFilter = (req, file, cb) => {
//   const allowedTypes = [
//     'image/jpeg', 'image/png', 'image/gif', // Images
//     'audio/mpeg', 'audio/wav', 'audio/ogg', // Audio
//     'video/mp4', 'video/mov', 'video/avi', // Video
//     'application/pdf', 'text/plain' // PDF and TXT
//   ];
//   if (allowedTypes.includes(file.mimetype)) {
//     cb(null, true); // Accept the file
//   } else {
//     cb(new Error('Unsupported file type'), false); // Reject the file
//   }
// };

// export const upload = multer({
//   storage: storage,
//   fileFilter: fileFilter,
//   limits: {
//     fileSize: 100 * 1024 * 1024, // Limit file size to 100MB
//   },
// });

import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the upload directory
const uploadPath = path.join(__dirname, "../public/temp");

// Ensure the directory exists
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Define storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath); // Correct path handling
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Retain original filename
  },
});

// Define file filter to allow only specific file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif", // Images
    "audio/mpeg",
    "audio/wav",
    "audio/ogg", // Audio
    "video/mp4",
    "video/mov",
    "video/avi", // Video
    "application/pdf",
    "text/plain", // PDF and TXT
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error("Unsupported file type"), false); // Reject the file
  }
};

// Configure multer
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // Limit file size to 100MB
  },
});
