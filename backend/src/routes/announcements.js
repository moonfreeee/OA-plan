const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/db');
const { success, fail } = require('../utils/response');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT a.announcement_id, a.title, a.content, a.created_at, u.real_name AS publisher_name
       FROM Announcements a JOIN Users u ON u.user_id = a.publisher_id
       ORDER BY a.created_at DESC`
    );
    return success(res, result.recordset);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  requireAuth,
  requireRole('admin'),
  [body('title').trim().notEmpty(), body('content').trim().notEmpty()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return fail(res, errors.array()[0].msg);
      const { title, content } = req.body;
      const result = await query(
        `INSERT INTO Announcements (title, content, publisher_id) OUTPUT INSERTED.*
         VALUES (@title, @content, @publisherId)`,
        { title, content, publisherId: req.user.userId }
      );
      return success(res, result.recordset[0], '公告发布成功');
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/:id',
  requireAuth,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const { title, content } = req.body;
      await query(
        `UPDATE Announcements SET title = COALESCE(@title, title), content = COALESCE(@content, content),
         updated_at = GETDATE() WHERE announcement_id = @id`,
        { id: parseInt(req.params.id, 10), title, content }
      );
      return success(res, null, '更新成功');
    } catch (err) {
      next(err);
    }
  }
);

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    await query('DELETE FROM Announcements WHERE announcement_id = @id', {
      id: parseInt(req.params.id, 10),
    });
    return success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
