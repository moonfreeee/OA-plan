require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { prepareDemoVideos } = require('../src/utils/videoPrepare');

prepareDemoVideos();
console.log('演示视频准备完成');
