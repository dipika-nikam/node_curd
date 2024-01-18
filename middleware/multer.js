const multer = require('multer');
const path = require('path');

const uploadFilePath = path.resolve(__dirname, '../..', 'public/uploads');

const storage = multer.diskStorage({
  destination: uploadFilePath,
  filename: function (req, file, callback) {
    callback(null, `${new Date().getTime().toString()}-${file.fieldname}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, callback) {
    const extension = ['.jpg', '.jpeg', '.png'].indexOf(path.extname(file.originalname).toLowerCase()) >= 0;
    const mimeType = ['image/jpg', 'image/jpeg', 'image/png'].indexOf(file.mimetype) >= 0;

    if (extension && mimeType) {
      return callback(null, true);
    }

    callback(new Error('Invalid file type. Only Image file on type JPG, Jpeg and PNG are allowed!'));
  },
});

// Custom error handling for Multer middleware
upload.customErrorHandler = function (err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ message: 'File too large. Max size is 5MB.' });
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({ message: 'You added only one file at a time' });
    }
  } else if (err) {
    res.status(500).json({ message: err.message });
  } else {
    next();
  }
};

module.exports = upload;
