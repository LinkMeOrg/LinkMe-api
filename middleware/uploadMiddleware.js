// middleware/uploadMiddleware.js
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ==================== PROFILE IMAGES STORAGE ====================
const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "linkme/profiles",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
    transformation: [
      {
        width: 500,
        height: 500,
        crop: "fill",
        quality: "auto:good",
      },
    ],
    public_id: (req, file) => {
      const userId = req.user.id;
      const timestamp = Date.now();
      return `profile_${userId}_${timestamp}`;
    },
  },
});

// ==================== QR CODE STORAGE ====================
const qrCodeStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "linkme/qrcodes",
    allowed_formats: ["png"],
    public_id: (req, file) => {
      const userId = req.user.id;
      const timestamp = Date.now();
      return `qr_${userId}_${timestamp}`;
    },
  },
});

// ==================== AI BACKGROUND STORAGE ====================
const aiBackgroundStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "linkme/backgrounds",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      {
        width: 1200,
        height: 800,
        crop: "fill",
        quality: "auto:good",
      },
    ],
    public_id: (req, file) => {
      const userId = req.user.id;
      const timestamp = Date.now();
      return `bg_${userId}_${timestamp}`;
    },
  },
});

// ==================== FILE FILTER ====================
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed!"), false);
  }
  cb(null, true);
};

// ==================== MULTER INSTANCES ====================
const uploadProfile = multer({
  storage: profileStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

const uploadQR = multer({
  storage: qrCodeStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
});

const uploadBackground = multer({
  storage: aiBackgroundStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// ==================== ERROR HANDLER MIDDLEWARE ====================
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File size is too large. Maximum size is 5MB for profiles.",
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "Error uploading file",
    });
  }

  next();
};

// ==================== DELETE IMAGE HELPER ====================
const deleteImage = async (imageUrl) => {
  try {
    if (!imageUrl) return;

    // Extract public_id from Cloudinary URL
    const urlParts = imageUrl.split("/");
    const filename = urlParts[urlParts.length - 1];
    const publicId = filename.split(".")[0];
    const folder = urlParts[urlParts.length - 2];

    await cloudinary.uploader.destroy(`${folder}/${publicId}`);
    console.log(`Image deleted: ${publicId}`);
  } catch (error) {
    console.error("Error deleting image:", error);
  }
};

// ==================== EXPORTS ====================
module.exports = {
  uploadProfile: uploadProfile.single("avatar"),
  uploadQR: uploadQR.single("qrCode"),
  uploadBackground: uploadBackground.single("background"),
  uploadMultiple: uploadProfile.array("images", 5),
  handleUploadError,
  deleteImage,
  cloudinary,
};
