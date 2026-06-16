const express = require('express');
const { query } = require('../config/db');
const { success } = require('../utils/response');
const { requireAuth } = require('../middleware/auth');

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

module.exports = router;
