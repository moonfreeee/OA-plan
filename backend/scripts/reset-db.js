/**
 * 清空并重新写入演示数据（修复 sqlcmd 编码导致的乱码）。
 * 用法：npm run reset-db
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { getPool } = require('../src/config/db');
const { seedDatabase } = require('./seed');

const TABLES = [
  'PasswordResetRequests',
  'ClockInRecords',
  'LearningProgress',
  'CourseChapters',
  'Courses',
  'AssessmentScores',
  'AssessmentPeriods',
  'TeamTasks',
  'TeamMembershipRequests',
  'TeamMembers',
  'Teams',
  'Announcements',
  'PasswordResetCodes',
  'Users',
];

const IDENTITY_TABLES = [
  'Users',
  'PasswordResetCodes',
  'Announcements',
  'Teams',
  'TeamMembers',
  'TeamMembershipRequests',
  'TeamTasks',
  'AssessmentPeriods',
  'AssessmentScores',
  'Courses',
  'CourseChapters',
  'LearningProgress',
  'ClockInRecords',
  'PasswordResetRequests',
];

async function reset() {
  const pool = await getPool();
  console.log('正在清空业务表…');
  await pool.request().query('EXEC sp_msforeachtable "ALTER TABLE ? NOCHECK CONSTRAINT ALL"');
  for (const table of TABLES) {
    await pool.request().query(`DELETE FROM ${table}`);
  }
  for (const table of IDENTITY_TABLES) {
    await pool.request().query(`DBCC CHECKIDENT ('${table}', RESEED, 0)`);
  }
  await pool.request().query('EXEC sp_msforeachtable "ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL"');
  console.log('表已清空，开始写入演示数据…');
  await seedDatabase({ force: true });
  console.log('reset-db 完成');
}

reset()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('reset-db 失败:', err.message);
    process.exit(1);
  });
