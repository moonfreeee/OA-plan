const jwt = require('jsonwebtoken');
const { fail } = require('../utils/response');

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return fail(res, '未登录或 Token 无效', 401, 401);
  }
  try {
    const token = header.slice(7);
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return fail(res, 'Token 已过期或无效', 401, 401);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return fail(res, '权限不足', 403, 403);
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
