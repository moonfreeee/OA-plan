const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/db');
const { success, fail } = require('../utils/response');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

function validate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    fail(res, errors.array()[0].msg);
    return false;
  }
  return true;
}

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT user_id, username, email, role, status, real_name, student_no, phone, avatar, bio, created_at
       FROM Users WHERE user_id = @userId`,
      { userId: req.user.userId }
    );
    if (!result.recordset.length) return fail(res, '用户不存在', 404, 404);
    return success(res, result.recordset[0]);
  } catch (err) {
    next(err);
  }
});

router.put(
  '/me',
  requireAuth,
  [
    body('real_name').optional().trim(),
    body('phone').optional().trim(),
    body('avatar').optional().trim(),
    body('bio').optional().trim(),
  ],
  async (req, res, next) => {
    try {
      if (!validate(req, res)) return;
      const { real_name, phone, avatar, bio } = req.body;
      await query(
        `UPDATE Users SET real_name = COALESCE(@real_name, real_name), phone = COALESCE(@phone, phone),
         avatar = COALESCE(@avatar, avatar), bio = COALESCE(@bio, bio), updated_at = GETDATE()
         WHERE user_id = @userId`,
        { userId: req.user.userId, real_name, phone, avatar, bio }
      );
      const result = await query(
        `SELECT user_id, username, email, role, status, real_name, student_no, phone, avatar, bio FROM Users WHERE user_id = @userId`,
        { userId: req.user.userId }
      );
      return success(res, result.recordset[0], '更新成功');
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/me/password',
  requireAuth,
  [
    body('old_password').notEmpty().withMessage('请输入旧密码'),
    body('new_password').isLength({ min: 6 }).withMessage('新密码至少 6 位'),
  ],
  async (req, res, next) => {
    try {
      if (!validate(req, res)) return;
      const { old_password, new_password } = req.body;
      const result = await query('SELECT password_hash FROM Users WHERE user_id = @userId', {
        userId: req.user.userId,
      });
      const user = result.recordset[0];
      const ok = await bcrypt.compare(old_password, user.password_hash);
      if (!ok) return fail(res, '旧密码不正确');
      const password_hash = await bcrypt.hash(new_password, 10);
      await query('UPDATE Users SET password_hash = @password_hash, updated_at = GETDATE() WHERE user_id = @userId', {
        password_hash,
        userId: req.user.userId,
      });
      return success(res, null, '密码修改成功');
    } catch (err) {
      next(err);
    }
  }
);

router.get('/me/summary', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const assessment = await query(
      `SELECT TOP 3 ap.title, ap.period_id,
        (ISNULL(s.tech_score,0)+ISNULL(s.team_score,0)+ISNULL(s.attitude_score,0)+ISNULL(s.contribution_score,0))/4.0 AS avg_score,
        s.published
       FROM AssessmentScores s
       JOIN AssessmentPeriods ap ON ap.period_id = s.period_id
       WHERE s.user_id = @userId AND s.published = 1
       ORDER BY ap.end_date DESC`,
      { userId }
    );
    const learning = await query(
      `SELECT c.course_id, c.title,
        CAST(COUNT(lp.progress_id) AS FLOAT) / NULLIF((SELECT COUNT(*) FROM CourseChapters cc WHERE cc.course_id = c.course_id), 0) * 100 AS progress_pct
       FROM Courses c
       LEFT JOIN CourseChapters ch ON ch.course_id = c.course_id
       LEFT JOIN LearningProgress lp ON lp.chapter_id = ch.chapter_id AND lp.user_id = @userId
       WHERE c.status = 'published'
       GROUP BY c.course_id, c.title
       HAVING COUNT(ch.chapter_id) > 0`,
      { userId }
    );
    return success(res, { assessments: assessment.recordset, learning: learning.recordset });
  } catch (err) {
    next(err);
  }
});

router.get('/admin/users', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { status } = req.query;
    let sqlText = `SELECT user_id, username, email, role, status, real_name, student_no, phone, created_at FROM Users`;
    const params = {};
    if (status) {
      sqlText += ' WHERE status = @status';
      params.status = status;
    }
    sqlText += ' ORDER BY created_at DESC';
    const result = await query(sqlText, params);
    return success(res, result.recordset);
  } catch (err) {
    next(err);
  }
});

router.put('/admin/users/:id/approve', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { action } = req.body;
    if (!['active', 'rejected'].includes(action)) return fail(res, '无效操作');
    await query('UPDATE Users SET status = @action, updated_at = GETDATE() WHERE user_id = @id', {
      action,
      id: parseInt(req.params.id, 10),
    });
    return success(res, null, action === 'active' ? '已通过审核' : '已拒绝');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
