const path = require('path');
const fs = require('fs');
const { DEMO_VIDEO_FILES, UPLOADS_DIR, PROJECT_ROOT, LEGACY_DEMO_FILES } = require('../config/demoVideos');

function listVideoFiles() {
  const dirs = [UPLOADS_DIR, PROJECT_ROOT];
  const names = new Set();
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (/\.mp4$/i.test(name)) names.add(name);
    }
  }
  return [...names];
}

function findSourceFile(item) {
  const exact = [
    path.join(UPLOADS_DIR, item.filename),
    path.join(PROJECT_ROOT, item.filename),
  ];
  for (const p of exact) {
    if (fs.existsSync(p)) return p;
  }

  const all = listVideoFiles();
  const matched = all.find((name) => item.match.every((m) => name.includes(m)));
  if (!matched) return null;
  for (const dir of [UPLOADS_DIR, PROJECT_ROOT]) {
    const p = path.join(dir, matched);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

/** 将源 MP4 同步到演示目录 */
function ensureMp4(sourcePath, mp4Path) {
  if (!fs.existsSync(sourcePath)) return false;
  if (path.extname(sourcePath).toLowerCase() !== '.mp4') {
    console.warn(`[video] 跳过非 MP4 源文件: ${path.basename(sourcePath)}`);
    return false;
  }

  const sameFile = path.resolve(sourcePath) === path.resolve(mp4Path);
  const destOk = fs.existsSync(mp4Path) && fs.statSync(mp4Path).size > 0;
  const sourceNewer =
    destOk &&
    !sameFile &&
    fs.statSync(sourcePath).mtimeMs > fs.statSync(mp4Path).mtimeMs;

  if (destOk && (sameFile || !sourceNewer)) return true;

  if (!sameFile) {
    try {
      fs.copyFileSync(sourcePath, mp4Path);
      console.log(`[video] 已同步 MP4: ${path.basename(sourcePath)} → ${path.basename(mp4Path)}`);
    } catch (err) {
      if (err.code === 'EBUSY' && destOk) {
        console.warn(`[video] 文件占用，跳过同步: ${path.basename(mp4Path)}`);
        return true;
      }
      console.warn(`[video] 同步失败: ${path.basename(mp4Path)} - ${err.message}`);
      return destOk;
    }
  }
  return fs.existsSync(mp4Path) && fs.statSync(mp4Path).size > 0;
}

function removeLegacyDemoFiles() {
  for (const name of LEGACY_DEMO_FILES) {
    for (const dir of [UPLOADS_DIR, PROJECT_ROOT]) {
      const p = path.join(dir, name);
      try {
        if (fs.existsSync(p)) {
          fs.unlinkSync(p);
          console.log(`[video] 已删除旧演示文件: ${name}`);
        }
      } catch (err) {
        if (err.code !== 'ENOENT') {
          console.warn(`[video] 删除旧文件失败 ${name}: ${err.message}`);
        }
      }
    }
  }
}

function prepareDemoVideos() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  removeLegacyDemoFiles();

  for (const item of DEMO_VIDEO_FILES) {
    const source = findSourceFile(item);
    if (!source) {
      console.warn(`[video] 未找到源文件: ${item.title}（请将 ${item.filename} 放入项目根目录或 uploads/videos/）`);
      continue;
    }
    const mp4Dest = path.join(UPLOADS_DIR, `${item.storageKey}.mp4`);
    ensureMp4(source, mp4Dest);
  }
}

function getDemoVideos() {
  return DEMO_VIDEO_FILES.map((item) => {
    const mp4Path = path.join(UPLOADS_DIR, `${item.storageKey}.mp4`);
    const hasMp4 = fs.existsSync(mp4Path) && fs.statSync(mp4Path).size > 0;
    const hasSource = hasMp4 || !!findSourceFile(item);

    return {
      id: item.id,
      title: item.title,
      filename: item.filename,
      storageKey: item.storageKey,
      url: hasMp4 ? `/uploads/videos/${item.storageKey}.mp4` : null,
      format: 'mp4',
      available: hasMp4,
      playable: hasMp4,
      preparing: hasSource && !hasMp4,
    };
  });
}

function isMp4Url(url) {
  return !!url && /\.mp4(\?|$)/i.test(url);
}

module.exports = {
  prepareDemoVideos,
  ensureMp4,
  getDemoVideos,
  isMp4Url,
  UPLOADS_DIR,
  DEMO_VIDEO_FILES,
};
