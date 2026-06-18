const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { UPLOADS_DIR } = require('./demoVideos');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename(_req, file, cb) {
    const base = path.basename(file.originalname, path.extname(file.originalname)).replace(/[^\w\u4e00-\u9fa5.-]/g, '_');
    cb(null, `${Date.now()}-${base}.mp4`);
  },
});

const videoUpload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = (file.mimetype || '').toLowerCase();
    if (ext === '.mp4' || mime === 'video/mp4') {
      cb(null, true);
    } else {
      cb(new Error('仅支持 MP4 格式视频，请先将文件转换为 .mp4 后上传'));
    }
  },
});

module.exports = { videoUpload, UPLOADS_DIR };
