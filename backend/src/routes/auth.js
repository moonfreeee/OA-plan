const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
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
      if (err.code === 'ESOCKET' || err.code === 'ECONNRESET' || err.message?.includes('Connection')) {
        return fail(res, '数据库连接失败，请检查 SQL Server 是否运行及 backend/.env 配置', 503, 503);
      }
      next(err);
    }
  }
);

router.post(
  '/password-reset-request',
  [
    body('account').trim().notEmpty().withMessage('请输入账号'),
    body('new_password').isLength({ min: 6 }).withMessage('新密码至少 6 位'),
    body('confirm_password').custom((v, { req }) => {
      if (v !== req.body.new_password) throw new Error('两次密码不一致');
      return true;
    }),
  ],
  async (req, res, next) => {
    try {
      if (!validate(req, res)) return;
      const { account, new_password } = req.body;
      const userResult = await query(
        `SELECT user_id, status FROM Users WHERE username = @account OR email = @account`,
        { account }
      );
      const user = userResult.recordset[0];
      if (!user) return fail(res, '账号不存在');
      if (user.status !== 'active') return fail(res, '账号状态异常，请联系管理员');

      const pending = await query(
        `SELECT request_id FROM PasswordResetRequests WHERE user_id = @userId AND status = 'pending'`,
        { userId: user.user_id }
      );
      if (pending.recordset.length) return fail(res, '您已有待审核的密码找回申请，请耐心等待');

      const password_hash = await bcrypt.hash(new_password, 10);
      await query(
        `INSERT INTO PasswordResetRequests (user_id, new_password_hash, status) VALUES (@userId, @password_hash, 'pending')`,
        { userId: user.user_id, password_hash }
      );
      return success(res, null, '密码找回申请已提交，请等待管理员审核');
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
