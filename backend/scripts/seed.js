/**
 * 使用 Node 写入演示数据，避免 sqlcmd 解析 bcrypt 哈希中的 $ 符号失败。
 * 用法：npm run seed
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { getPool } = require('../src/config/db');

async function tableEmpty(pool, table) {
  const r = await pool.request().query(`SELECT COUNT(*) AS cnt FROM ${table}`);
  return r.recordset[0].cnt === 0;
}

async function seedDatabase({ force = false } = {}) {
  const pool = await getPool();
  console.log('数据库连接成功');

  if (!force && !(await tableEmpty(pool, 'Users'))) {
    console.log('Users 表已有数据，跳过 seed（如需重建请运行 npm run reset-db）');
    return;
  }

  const adminHash = bcrypt.hashSync('Admin@123', 10);
  const memberHash = bcrypt.hashSync('Member@123', 10);
  const pendingHash = bcrypt.hashSync('Pending@123', 10);

  await pool
    .request()
    .input('adminHash', adminHash)
    .input('memberHash', memberHash)
    .input('pendingHash', pendingHash)
    .query(`
      INSERT INTO Users (username, email, password_hash, role, status, real_name, student_no, phone) VALUES
      ('admin', 'admin@sdo.local', @adminHash, 'admin', 'active', N'系统管理员', 'T001', '13800000001'),
      ('member1', 'member1@sdo.local', @memberHash, 'member', 'active', N'张三', '2021001', '13800000002'),
      ('member2', 'member2@sdo.local', @memberHash, 'member', 'active', N'李四', '2021002', '13800000003'),
      ('pending1', 'pending1@sdo.local', @pendingHash, 'member', 'pending', N'王五', '2021003', '13800000004');
    `);

  await pool.request().query(`
    INSERT INTO Announcements (title, content, publisher_id) VALUES
    (N'欢迎加入软件开发办公室', N'请各位新成员及时完善个人信息，并查看课程学习板块。', 1),
    (N'2025春季考核通知', N'春季考核周期已开启，请各团队负责人配合完成成员评估。', 1),
    (N'Vue3 培训课程上线', N'新课程《Vue3 前端开发入门》已发布，请成员自主学习。', 1);
  `);

  await pool.request().query(`
    INSERT INTO Teams (team_name, description, leader_id) VALUES
    (N'OA系统开发组', N'负责办公室内部管理系统的设计与开发', 2),
    (N'NFC硬件制作组', N'负责对打卡机等硬件的研发与维护', 2),
    (N'IT运维维护组', N'负责服务器的运营维护和搭建', 2);
  `);

  await pool.request().query(`INSERT INTO TeamMembers (team_id, user_id) VALUES (1, 2), (1, 3);`);

  await pool.request().query(`
    INSERT INTO TeamTasks (team_id, title, description, status, assignee_id, creator_id) VALUES
    (1, N'完成登录模块', N'实现用户登录、注册与 JWT 认证', 'done', 2, 1),
    (1, N'开发仪表盘页面', N'统计卡片与公告展示', 'doing', 2, 1),
    (1, N'团队任务看板', N'三列任务看板 UI', 'todo', 3, 1);
  `);

  await pool.request().query(`
    INSERT INTO AssessmentPeriods (title, start_date, end_date, status) VALUES
    (N'2025 春季考核', '2025-03-01', '2025-06-30', 'active'),
    (N'2024 秋季考核', '2024-09-01', '2024-12-31', 'closed'),
    (N'2023 春季考核', '2023-03-01', '2023-06-30', 'closed');
  `);

  await pool.request().query(`
    INSERT INTO AssessmentScores (period_id, user_id, tech_score, team_score, attitude_score, contribution_score, comment, published) VALUES
    (1, 2, 88, 90, 92, 85, N'技术扎实，团队协作良好', 1),
    (1, 3, 82, 88, 90, 80, N'进步明显，需加强项目贡献', 1),
    (2, 2, 85, 88, 90, 82, N'项目推进稳定', 1),
    (3, 2, 80, 85, 88, 78, N'学习态度积极', 1);
  `);

  await pool.request().query(`
    INSERT INTO Courses (title, category, description, difficulty, status, video_url) VALUES
    (N'Vue3 前端开发入门', N'前端', N'Vue3 组合式 API、Vue Router、Pinia 基础', 'beginner', 'published', NULL),
    (N'Node.js 后端开发', N'后端', N'Express REST API 与 SQL Server 集成', 'intermediate', 'published', N'/uploads/videos/demo-mongodb-install.mp4'),
    (N'软件工程实践', N'软工', N'需求分析、UML 建模与测试方法', 'beginner', 'published', NULL);
  `);

  await pool.request().query(`
    INSERT INTO CourseChapters (course_id, title, content, sort_order, duration_min) VALUES
    (1, N'Vue3 简介', N'## Vue3 简介', 1, 30),
    (1, N'组合式 API', N'## 组合式 API', 2, 45),
    (1, N'Vue Router', N'## Vue Router', 3, 40),
    (2, N'Express 基础', N'## Express', 1, 35),
    (2, N'连接 SQL Server', N'## mssql', 2, 50),
    (3, N'需求分析', N'## 需求分析', 1, 40),
    (3, N'软件测试', N'## 测试', 2, 35);
  `);

  await pool.request().query(`INSERT INTO LearningProgress (user_id, chapter_id) VALUES (2, 1), (2, 2), (3, 1);`);

  console.log('演示数据写入完成');
  console.log('账号: admin / Admin@123 , member1 / Member@123');
}

module.exports = { seedDatabase };

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('seed 失败:', err.message);
      process.exit(1);
    });
}
