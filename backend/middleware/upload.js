const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const fileFilter = (_, file, cb) => {
  const ok = /^image\/(jpeg|png|webp|gif|heic|heif)$/i.test(file.mimetype);
  cb(null, ok);
};

function createImageUploader(filePrefix) {
  const storage = multer.diskStorage({
    destination: (_, __, cb) => cb(null, uploadsDir),
    filename: (_, file, cb) => {
      const ext = path.extname(file.originalname || '') || '.jpg';
      cb(null, `${filePrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`);
    },
  });
  return multer({
    storage,
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter,
  });
}

/** Payment screenshots (ticket requests) */
const paymentUpload = createImageUploader('pay');
/** Event cover images (admin) */
const eventImageUpload = createImageUploader('evt');

/** Skip multer for JSON — otherwise `single()` clears `req.body` and updates fail validation. */
function optionalEventImageUpload(req, res, next) {
  const ct = (req.headers['content-type'] || '').toLowerCase();
  if (ct.includes('multipart/form-data')) {
    return eventImageUpload.single('eventImage')(req, res, next);
  }
  next();
}

module.exports = paymentUpload;
module.exports.eventImageUpload = eventImageUpload;
module.exports.optionalEventImageUpload = optionalEventImageUpload;
