const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/db');
const { success, fail } = require('../utils/response');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/periods', requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      'SELECT period_id, title, start_date, end_date, status, created_at FROM AssessmentPeriods ORDER BY start_date DESC'
    );
    return success(res, result.recordset);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/periods',
  requireAuth,
  requireRole('admin'),
  [
    body('title').trim().notEmpty(),
    body('start_date').isISO8601(),
    body('end_date').isISO8601(),
    body('status').optional().isIn(['draft', 'active', 'closed']),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return fail(res, errors.array()[0].msg);
      const { title, start_date, end_date, status } = req.body;
      const result = await query(
        `INSERT INTO AssessmentPeriods (title, start_date, end_date, status) OUTPUT INSERTED.*
         VALUES (@title, @start_date, @end_date, @status)`,
        { title, start_date, end_date, status: status || 'draft' }
      );
      return success(res, result.recordset[0], '考核周期创建成功');
    } catch (err) {
      next(err);
    }
  }
);

router.put('/periods/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { title, start_date, end_date, status } = req.body;
    await query(
      `UPDATE AssessmentPeriods SET
       title = COALESCE(@title, title), start_date = COALESCE(@start_date, start_date),
       end_date = COALESCE(@end_date, end_date), status = COALESCE(@status, status),
       updated_at = GETDATE() WHERE period_id = @id`,
      { id: parseInt(req.params.id, 10), title, start_date, end_date, status }
    );
    return success(res, null, '更新成功');
  } catch (err) {
    next(err);
  }
});

router.get('/periods/query', requireAuth, async (req, res, next) => {
  try {
    const { year, month, day } = req.query;
    let sqlText =
      'SELECT period_id, title, start_date, end_date, status, created_at FROM AssessmentPeriods WHERE 1=1';
    const params = {};
    if (year) {
      sqlText += ' AND YEAR(end_date) = @year';
      params.year = parseInt(year, 10);
    }
    if (month) {
      sqlText += ' AND MONTH(end_date) = @month';
      params.month = parseInt(month, 10);
    }
    if (day) {
      sqlText += ' AND DAY(end_date) = @day';
      params.day = parseInt(day, 10);
    }
    sqlText += ' ORDER BY start_date DESC';
    const result = await query(sqlText, params);
    return success(res, result.recordset);
  } catch (err) {
    next(err);
  }
});

router.get('/my-scores', requireAuth, async (req, res, next) => {
  try {
    const { year, month, day } = req.query;
    let sqlText = `SELECT s.*, ap.title AS period_title, ap.start_date, ap.end_date, ap.status AS period_status,
        (ISNULL(s.tech_score,0)+ISNULL(s.team_score,0)+ISNULL(s.attitude_score,0)+ISNULL(s.contribution_score,0))/4.0 AS avg_score
       FROM AssessmentScores s
       JOIN AssessmentPeriods ap ON ap.period_id = s.period_id
       WHERE s.user_id = @userId AND s.published = 1`;
    const params = { userId: req.user.userId };
    if (year) {
      sqlText += ' AND YEAR(ap.end_date) = @year';
      params.year = parseInt(year, 10);
    }
    if (month) {
      sqlText += ' AND MONTH(ap.end_date) = @month';
      params.month = parseInt(month, 10);
    }
    if (day) {
      sqlText += ' AND DAY(ap.end_date) = @day';
      params.day = parseInt(day, 10);
    }
    sqlText += ' ORDER BY ap.end_date DESC';
    const result = await query(sqlText, params);
    return success(res, result.recordset);
  } catch (err) {
    next(err);
  }
});

router.get('/periods/:id/scores', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const periodId = parseInt(req.params.id, 10);
    const result = await query(
      `SELECT s.*, u.real_name, u.username, u.student_no,
        (ISNULL(s.tech_score,0)+ISNULL(s.team_score,0)+ISNULL(s.attitude_score,0)+ISNULL(s.contribution_score,0))/4.0 AS avg_score
       FROM AssessmentScores s
       JOIN Users u ON u.user_id = s.user_id
       WHERE s.period_id = @periodId
       ORDER BY u.real_name`,
      { periodId }
    );
    return success(res, result.recordset);
  } catch (err) {
    next(err);
  }
});

router.post('/scores', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const {
      period_id,
      user_id,
      tech_score,
      team_score,
      attitude_score,
      contribution_score,
      comment,
      published,
    } = req.body;
    if (!period_id || !user_id) return fail(res, '缺少 period_id 或 user_id');
    const existing = await query(
      'SELECT score_id FROM AssessmentScores WHERE period_id = @period_id AND user_id = @user_id',
      { period_id, user_id }
    );
    if (existing.recordset.length) {
      await query(
        `UPDATE AssessmentScores SET tech_score = @tech_score, team_score = @team_score,
         attitude_score = @attitude_score, contribution_score = @contribution_score,
         comment = @comment, published = COALESCE(@published, published), updated_at = GETDATE()
         WHERE period_id = @period_id AND user_id = @user_id`,
        { period_id, user_id, tech_score, team_score, attitude_score, contribution_score, comment, published: published ? 1 : 0 }
      );
    } else {
      await query(
        `INSERT INTO AssessmentScores (period_id, user_id, tech_score, team_score, attitude_score, contribution_score, comment, published)
         VALUES (@period_id, @user_id, @tech_score, @team_score, @attitude_score, @contribution_score, @comment, @published)`,
        { period_id, user_id, tech_score, team_score, attitude_score, contribution_score, comment, published: published ? 1 : 0 }
      );
    }
    return success(res, null, '成绩保存成功');
  } catch (err) {
    next(err);
  }
});

router.put('/scores/:id/publish', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    await query('UPDATE AssessmentScores SET published = 1, updated_at = GETDATE() WHERE score_id = @id', {
      id: parseInt(req.params.id, 10),
    });
    return success(res, null, '成绩已发布');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
