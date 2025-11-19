const multer = require("multer");
const path = require("path");

// Set up storage for the images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Ensure you create an 'uploads' directory
  },
  filename: (req, file, cb) => {
    const fileName = Date.now() + path.extname(file.originalname);
    cb(null, fileName); // Set the filename to be the timestamp plus file extension
  },
});

// File filter to accept only image files
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPG, PNG, and GIF are allowed."));
  }
};

// Set up the upload fields for the main image and other images
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
}).fields([
  { name: "mainImage", maxCount: 1 },
  { name: "subImage", maxCount: 4 },
]);

module.exports = upload;
