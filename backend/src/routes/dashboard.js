const express = require('express');
const { query } = require('../config/db');
const { success, fail } = require('../utils/response');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/summary', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const teams = await query(
      'SELECT COUNT(*) AS cnt FROM TeamMembers WHERE user_id = @userId',
      { userId }
    );
    const courses = await query(
      `SELECT COUNT(DISTINCT c.course_id) AS cnt FROM Courses c
       JOIN CourseChapters ch ON ch.course_id = c.course_id
       LEFT JOIN LearningProgress lp ON lp.chapter_id = ch.chapter_id AND lp.user_id = @userId
       WHERE c.status = 'published'
       GROUP BY c.course_id
       HAVING COUNT(ch.chapter_id) > COUNT(lp.progress_id)`,
      { userId }
    );
    const assessments = await query(
      `SELECT COUNT(*) AS cnt FROM AssessmentPeriods ap
       WHERE ap.status = 'active'
       AND NOT EXISTS (
         SELECT 1 FROM AssessmentScores s WHERE s.period_id = ap.period_id AND s.user_id = @userId AND s.published = 1
       )`,
      { userId }
    );
    const announcements = await query('SELECT COUNT(*) AS cnt FROM Announcements', {});

    const recentAnnouncements = await query(
      `SELECT TOP 5 a.announcement_id, a.title, a.content, a.created_at, u.real_name AS publisher_name
       FROM Announcements a JOIN Users u ON u.user_id = a.publisher_id
       ORDER BY a.created_at DESC`
    );

    const activities = await query(
      `SELECT TOP 10 * FROM (
        SELECT 'assessment' AS type, N'考核结果更新' AS title, ap.title AS detail, s.updated_at AS time
        FROM AssessmentScores s JOIN AssessmentPeriods ap ON ap.period_id = s.period_id
        WHERE s.user_id = @userId AND s.published = 1
        UNION ALL
        SELECT 'task', N'团队任务变更', t.title, t.updated_at
        FROM TeamTasks t JOIN TeamMembers tm ON tm.team_id = t.team_id
        WHERE tm.user_id = @userId
        UNION ALL
        SELECT 'learning', N'课程进度更新', ch.title, lp.completed_at
        FROM LearningProgress lp JOIN CourseChapters ch ON ch.chapter_id = lp.chapter_id
        WHERE lp.user_id = @userId
      ) x ORDER BY time DESC`,
      { userId }
    );

    return success(res, {
      stats: {
        teamCount: teams.recordset[0]?.cnt || 0,
        courseInProgress: courses.recordset.length,
        pendingAssessment: assessments.recordset[0]?.cnt || 0,
        announcementCount: announcements.recordset[0]?.cnt || 0,
      },
      announcements: recentAnnouncements.recordset,
      activities: activities.recordset,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/clock-in/today', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const result = await query(
      `SELECT u.user_id, u.username, u.real_name, u.student_no, u.role,
        c.clock_in_time,
        CASE WHEN c.record_id IS NOT NULL THEN 1 ELSE 0 END AS clocked_in
       FROM Users u
       LEFT JOIN ClockInRecords c ON c.user_id = u.user_id AND c.clock_date = CAST(GETDATE() AS DATE)
       WHERE u.status = 'active'
       ORDER BY clocked_in DESC, c.clock_in_time ASC, u.real_name`
    );
    const list = result.recordset.map((row) => ({
      user_id: row.user_id,
      username: row.username,
      real_name: row.real_name,
      student_no: row.student_no,
      role: row.role,
      clocked_in: !!row.clocked_in,
      clock_in_time: row.clock_in_time || null,
    }));
    const clockedCount = list.filter((r) => r.clocked_in).length;
    return success(res, {
      date: new Date().toISOString().slice(0, 10),
      total: list.length,
      clocked_count: clockedCount,
      absent_count: list.length - clockedCount,
      records: list,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/clock-in', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const result = await query(
      `SELECT clock_in_time FROM ClockInRecords
       WHERE user_id = @userId AND clock_date = CAST(GETDATE() AS DATE)`,
      { userId }
    );
    const row = result.recordset[0];
    return success(res, {
      clockedIn: !!row,
      clockInTime: row?.clock_in_time || null,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/clock-in', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const existing = await query(
      `SELECT record_id FROM ClockInRecords
       WHERE user_id = @userId AND clock_date = CAST(GETDATE() AS DATE)`,
      { userId }
    );
    if (existing.recordset.length) {
      return fail(res, '今日已打卡', 1, 400);
    }
    const result = await query(
      `INSERT INTO ClockInRecords (user_id, clock_date, clock_in_time)
       OUTPUT INSERTED.clock_in_time
       VALUES (@userId, CAST(GETDATE() AS DATE), GETDATE())`,
      { userId }
    );
    return success(
      res,
      { clockedIn: true, clockInTime: result.recordset[0].clock_in_time },
      '打卡成功'
    );
  } catch (err) {
    next(err);
  }
});

module.exports = router;
