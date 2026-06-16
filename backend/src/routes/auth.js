const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, sql } = require('../config/db');
const { success, fail } = require('../utils/response');

const router = express.Router();

function validate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    fail(res, errors.array()[0].msg);
    return false;
  }
  return true;
}

router.post(
  '/register',
  [
    body('username').trim().isLength({ min: 3, max: 50 }).withMessage('用户名 3-50 字符'),
    body('email').isEmail().withMessage('邮箱格式不正确'),
    body('password').isLength({ min: 6 }).withMessage('密码至少 6 位'),
    body('real_name').trim().notEmpty().withMessage('姓名不能为空'),
    body('student_no').optional().trim(),
  ],
  async (req, res, next) => {
    try {
      if (!validate(req, res)) return;
      const { username, email, password, real_name, student_no } = req.body;
      const exists = await query(
        'SELECT user_id FROM Users WHERE username = @username OR email = @email',
        { username, email }
      );
      if (exists.recordset.length) {
        return fail(res, '用户名或邮箱已存在');
      }
      const password_hash = await bcrypt.hash(password, 10);
      await query(
        `INSERT INTO Users (username, email, password_hash, role, status, real_name, student_no)
         VALUES (@username, @email, @password_hash, 'member', 'pending', @real_name, @student_no)`,
        { username, email, password_hash, real_name, student_no: student_no || null }
      );
      return success(res, null, '注册成功，请等待管理员审核');
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/login',
  [
    body('account').trim().notEmpty().withMessage('请输入用户名或邮箱'),
    body('password').notEmpty().withMessage('请输入密码'),
  ],
  async (req, res, next) => {
    try {
      if (!validate(req, res)) return;
      const { account, password } = req.body;
      const result = await query(
        `SELECT user_id, username, email, password_hash, role, status, real_name, student_no, phone, avatar, bio
         FROM Users WHERE username = @account OR email = @account`,
        { account }
      );
      const user = result.recordset[0];
      if (!user) return fail(res, '用户名或密码错误', 1, 401);
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return fail(res, '用户名或密码错误', 1, 401);
      if (user.status === 'pending') return fail(res, '账号待审核，请联系管理员', 1, 403);
      if (user.status === 'rejected') return fail(res, '账号已被拒绝', 1, 403);
      const token = jwt.sign(
        { userId: user.user_id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );
      delete user.password_hash;
      return success(res, { token, user }, '登录成功');
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/reset-password/request',
  [body('email').isEmail().withMessage('邮箱格式不正确')],
  async (req, res, next) => {
    try {
      if (!validate(req, res)) return;
      const { email } = req.body;
      const result = await query('SELECT user_id FROM Users WHERE email = @email', { email });
      if (!result.recordset.length) {
        return fail(res, '该邮箱未注册');
      }
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const expires = new Date(Date.now() + 5 * 60 * 1000);
      await query(
        `INSERT INTO PasswordResetCodes (email, code, expires_at) VALUES (@email, @code, @expires)`,
        { email, code, expires }
      );
      console.log(`[重置密码] 邮箱 ${email} 验证码: ${code}`);
      return success(res, { code, message: '实验环境：验证码已在响应中返回（生产环境应发送邮件）' }, '验证码已生成');
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/reset-password/confirm',
  [
    body('email').isEmail().withMessage('邮箱格式不正确'),
    body('code').trim().notEmpty().withMessage('请输入验证码'),
    body('new_password').isLength({ min: 6 }).withMessage('新密码至少 6 位'),
  ],
  async (req, res, next) => {
    try {
      if (!validate(req, res)) return;
      const { email, code, new_password } = req.body;
      const result = await query(
        `SELECT TOP 1 id, code, expires_at, used FROM PasswordResetCodes
         WHERE email = @email AND used = 0 ORDER BY created_at DESC`,
        { email }
      );
      const row = result.recordset[0];
      if (!row || row.code !== code) return fail(res, '验证码无效');
      if (new Date(row.expires_at) < new Date()) return fail(res, '验证码已过期');
      const password_hash = await bcrypt.hash(new_password, 10);
      await query('UPDATE Users SET password_hash = @password_hash, updated_at = GETDATE() WHERE email = @email', {
        password_hash,
        email,
      });
      await query('UPDATE PasswordResetCodes SET used = 1 WHERE id = @id', { id: row.id });
      return success(res, null, '密码重置成功');
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
