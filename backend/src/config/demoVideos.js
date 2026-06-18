const path = require('path');

/** 项目根目录下的演示视频（可放在 OA plan 根目录或 uploads/videos/） */
const DEMO_VIDEO_FILES = [
  {
    id: 'demo-mongodb-install',
    title: '9.2-1 MongoDB 安装与测试',
    filename: '9.2-1 MongoDBinstall_test.mp4',
    storageKey: 'demo-mongodb-install',
    match: ['9.2-1', 'MongoDB'],
  },
  {
    id: 'demo-query-data',
    title: '9.4-2 QueryData',
    filename: '9.4-2 QueryData.mp4',
    storageKey: 'demo-query-data',
    match: ['9.4-2', 'QueryData'],
  },
];

const PROJECT_ROOT = path.join(__dirname, '../../..');
const UPLOADS_DIR = path.join(PROJECT_ROOT, 'uploads', 'videos');

/** 已废弃的旧演示文件（启动时清理） */
const LEGACY_DEMO_FILES = [
  '1.2-1安装node并测试.wmv',
  '2.1-1npm使用.wmv',
  'demo-node-install.wmv',
  'demo-node-install.mp4',
  'demo-npm.wmv',
  'demo-npm.mp4',
];

module.exports = { DEMO_VIDEO_FILES, UPLOADS_DIR, PROJECT_ROOT, LEGACY_DEMO_FILES };
