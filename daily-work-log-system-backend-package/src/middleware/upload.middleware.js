const multer = require('multer');

// ⚙️ Storage בזיכרון – לא שומרים לדיסק בכלל
const memoryStorage = multer.memoryStorage();

// File filter for photos
const photoFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// File filter for documents
const documentFilter = (req, file, cb) => {
  // Accept only PDF, DOC, DOCX, XLS, XLSX, and image files
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, DOCX, XLS, XLSX, and image files are allowed!'), false);
  }
};

// 📸 multer להגדרת העלאת תמונות (לוג יומי)
const uploadPhotos = multer({
  storage: memoryStorage,      // ⬅️ במקום diskStorage
  fileFilter: photoFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// 📄 multer להגדרת העלאת מסמכים (לוג יומי)
const uploadDocuments = multer({
  storage: memoryStorage,      // ⬅️ במקום diskStorage
  fileFilter: documentFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// 🧩 העלאה משולבת (deliveryCertificate + workPhotos) – למשל ל־CreateDailyLog אחר
const combinedUpload = multer({
  storage: memoryStorage,      // ⬅️ גם כאן רק בזיכרון
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'workPhotos') {
      return photoFilter(req, file, cb);
    } else if (file.fieldname === 'deliveryCertificate') {
      return documentFilter(req, file, cb);
    }
    cb(new Error('Unknown field'), false);
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max per file
  }
});

// 📌 שדות מרובים בטופס אחד
const uploadFields = combinedUpload.fields([
  { name: 'deliveryCertificate', maxCount: 1 },
  { name: 'workPhotos', maxCount: 10 }  // או כמה שאתה רוצה
]);

// ✅ ייצוא יחיד ומסודר
module.exports = {
  uploadPhotos,
  uploadDocuments,
  uploadFields
};
