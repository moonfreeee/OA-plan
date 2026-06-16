const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/db');
const { success, fail } = require('../utils/response');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const isAdmin = req.user.role === 'admin';
    let sqlText = `SELECT c.course_id, c.title, c.category, c.description, c.cover_url, c.difficulty, c.status, c.created_at,
      (SELECT COUNT(*) FROM CourseChapters ch WHERE ch.course_id = c.course_id) AS chapter_count,
      (SELECT COUNT(DISTINCT lp.user_id) FROM CourseChapters ch2
       JOIN LearningProgress lp ON lp.chapter_id = ch2.chapter_id WHERE ch2.course_id = c.course_id) AS learner_count`;
    if (!isAdmin) {
      sqlText += `, CAST((SELECT COUNT(*) FROM LearningProgress lp
        JOIN CourseChapters ch ON ch.chapter_id = lp.chapter_id
        WHERE ch.course_id = c.course_id AND lp.user_id = @userId) AS FLOAT)
        / NULLIF((SELECT COUNT(*) FROM CourseChapters ch WHERE ch.course_id = c.course_id), 0) * 100 AS my_progress`;
    }
    sqlText += ` FROM Courses c WHERE c.status = 'published' OR @isAdmin = 1 ORDER BY c.created_at DESC`;
    const result = await query(sqlText, { userId, isAdmin: isAdmin ? 1 : 0 });
    return success(res, result.recordset);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const courseId = parseInt(req.params.id, 10);
    const course = await query('SELECT * FROM Courses WHERE course_id = @courseId', { courseId });
    if (!course.recordset.length) return fail(res, '课程不存在', 404, 404);
    const chapters = await query(
      `SELECT ch.*,
        CASE WHEN lp.progress_id IS NOT NULL THEN 1 ELSE 0 END AS completed
       FROM CourseChapters ch
       LEFT JOIN LearningProgress lp ON lp.chapter_id = ch.chapter_id AND lp.user_id = @userId
       WHERE ch.course_id = @courseId ORDER BY ch.sort_order`,
      { courseId, userId: req.user.userId }
    );
    const total = chapters.recordset.length;
    const done = chapters.recordset.filter((c) => c.completed).length;
    return success(res, {
      ...course.recordset[0],
      chapters: chapters.recordset,
      progress_pct: total ? Math.round((done / total) * 100) : 0,
    });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  requireAuth,
  requireRole('admin'),
  [body('title').trim().notEmpty(), body('category').trim().notEmpty()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return fail(res, errors.array()[0].msg);
      const { title, category, description, cover_url, difficulty, status } = req.body;
      const result = await query(
        `INSERT INTO Courses (title, category, description, cover_url, difficulty, status) OUTPUT INSERTED.*
         VALUES (@title, @category, @description, @cover_url, @difficulty, @status)`,
        {
          title,
          category,
          description: description || null,
          cover_url: cover_url || null,
          difficulty: difficulty || 'beginner',
          status: status || 'draft',
        }
      );
      return success(res, result.recordset[0], '课程创建成功');
    } catch (err) {
      next(err);
    }
  }
);

router.put('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const courseId = parseInt(req.params.id, 10);
    const { title, category, description, cover_url, difficulty, status } = req.body;
    await query(
      `UPDATE Courses SET title = COALESCE(@title, title), category = COALESCE(@category, category),
       description = COALESCE(@description, description), cover_url = COALESCE(@cover_url, cover_url),
       difficulty = COALESCE(@difficulty, difficulty), status = COALESCE(@status, status),
       updated_at = GETDATE() WHERE course_id = @courseId`,
      { courseId, title, category, description, cover_url, difficulty, status }
    );
    return success(res, null, '更新成功');
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    await query('DELETE FROM Courses WHERE course_id = @courseId', {
      courseId: parseInt(req.params.id, 10),
    });
    return success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
});

router.post(
  '/:id/chapters',
  requireAuth,
  requireRole('admin'),
  [body('title').trim().notEmpty()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return fail(res, errors.array()[0].msg);
      const courseId = parseInt(req.params.id, 10);
      const { title, content, sort_order, duration_min } = req.body;
      const result = await query(
        `INSERT INTO CourseChapters (course_id, title, content, sort_order, duration_min) OUTPUT INSERTED.*
         VALUES (@courseId, @title, @content, @sort_order, @duration_min)`,
        {
          courseId,
          title,
          content: content || null,
          sort_order: sort_order || 0,
          duration_min: duration_min || 30,
        }
      );
      return success(res, result.recordset[0], '章节添加成功');
    } catch (err) {
      next(err);
    }
  }
);

router.put('/:id/chapters/:chapterId', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { title, content, sort_order, duration_min } = req.body;
    await query(
      `UPDATE CourseChapters SET title = COALESCE(@title, title), content = COALESCE(@content, content),
       sort_order = COALESCE(@sort_order, sort_order), duration_min = COALESCE(@duration_min, duration_min),
       updated_at = GETDATE() WHERE chapter_id = @chapterId AND course_id = @courseId`,
      {
        chapterId: parseInt(req.params.chapterId, 10),
        courseId: parseInt(req.params.id, 10),
        title,
        content,
        sort_order,
        duration_min,
      }
    );
    return success(res, null, '章节更新成功');
  } catch (err) {
    next(err);
  }
});

router.delete('/:id/chapters/:chapterId', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    await query('DELETE FROM CourseChapters WHERE chapter_id = @chapterId AND course_id = @courseId', {
      chapterId: parseInt(req.params.chapterId, 10),
      courseId: parseInt(req.params.id, 10),
    });
    return success(res, null, '章节删除成功');
  } catch (err) {
    next(err);
  }
});

router.post('/chapters/:chapterId/complete', requireAuth, async (req, res, next) => {
  try {
    const chapterId = parseInt(req.params.chapterId, 10);
    const userId = req.user.userId;
    await query(
      `IF NOT EXISTS (SELECT 1 FROM LearningProgress WHERE user_id = @userId AND chapter_id = @chapterId)
       INSERT INTO LearningProgress (user_id, chapter_id) VALUES (@userId, @chapterId)`,
      { userId, chapterId }
    );
    return success(res, null, '已标记完成');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
