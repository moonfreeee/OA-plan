const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/db');
const { success, fail } = require('../utils/response');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

async function canManageTeam(userId, role, teamId) {
  if (role === 'admin') return true;
  const result = await query('SELECT leader_id FROM Teams WHERE team_id = @teamId', { teamId });
  return result.recordset[0]?.leader_id === userId;
}

router.get('/overview', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const teams = await query(
      `SELECT t.team_id, t.team_name, t.description, t.leader_id, t.created_at,
        u.real_name AS leader_name,
        (SELECT COUNT(*) FROM TeamMembers tm WHERE tm.team_id = t.team_id) AS member_count
       FROM Teams t LEFT JOIN Users u ON u.user_id = t.leader_id ORDER BY t.created_at DESC`
    );
    const joins = await query(
      `SELECT team_id, status FROM TeamMembershipRequests
       WHERE user_id = @userId AND type = 'join' AND status = 'pending'`,
      { userId }
    );
    const leaves = await query(
      `SELECT team_id FROM TeamMembershipRequests
       WHERE user_id = @userId AND type = 'leave' AND status = 'pending'`,
      { userId }
    );
    const memberOf = await query('SELECT team_id FROM TeamMembers WHERE user_id = @userId', { userId });
    const joinSet = new Set(joins.recordset.map((r) => r.team_id));
    const leaveSet = new Set(leaves.recordset.map((r) => r.team_id));
    const memberSet = new Set(memberOf.recordset.map((r) => r.team_id));
    const list = teams.recordset.map((t) => {
      let membership_status = 'none';
      if (memberSet.has(t.team_id)) membership_status = leaveSet.has(t.team_id) ? 'exit_pending' : 'joined';
      else if (joinSet.has(t.team_id)) membership_status = 'pending';
      return { ...t, membership_status };
    });
    return success(res, list);
  } catch (err) {
    next(err);
  }
});

router.get('/requests', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const status = req.query.status || 'pending';
    const result = await query(
      `SELECT r.request_id, r.team_id, r.user_id, r.type, r.status, r.created_at,
        t.team_name, u.real_name AS user_name
       FROM TeamMembershipRequests r
       JOIN Teams t ON t.team_id = r.team_id
       JOIN Users u ON u.user_id = r.user_id
       WHERE r.status = @status
       ORDER BY r.created_at DESC`,
      { status }
    );
    return success(res, result.recordset);
  } catch (err) {
    next(err);
  }
});

router.put('/requests/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const requestId = parseInt(req.params.id, 10);
    const action = req.body.action === 'reject' ? 'reject' : 'approve';
    const reqRow = await query(
      'SELECT * FROM TeamMembershipRequests WHERE request_id = @requestId AND status = \'pending\'',
      { requestId }
    );
    if (!reqRow.recordset.length) return fail(res, '申请不存在或已处理', 404, 404);
    const row = reqRow.recordset[0];
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    await query(
      `UPDATE TeamMembershipRequests SET status = @newStatus, reviewed_at = GETDATE(), reviewer_id = @reviewerId
       WHERE request_id = @requestId`,
      { requestId, newStatus, reviewerId: req.user.userId }
    );
    if (action === 'approve') {
      if (row.type === 'join') {
        await query(
          `IF NOT EXISTS (SELECT 1 FROM TeamMembers WHERE team_id = @teamId AND user_id = @userId)
           INSERT INTO TeamMembers (team_id, user_id) VALUES (@teamId, @userId)`,
          { teamId: row.team_id, userId: row.user_id }
        );
      } else {
        await query('DELETE FROM TeamMembers WHERE team_id = @teamId AND user_id = @userId', {
          teamId: row.team_id,
          userId: row.user_id,
        });
      }
    }
    const msg = action === 'approve'
      ? (row.type === 'join' ? '加入申请已通过' : '退出申请已通过')
      : (row.type === 'join' ? '加入申请已拒绝' : '退出申请已拒绝');
    return success(res, null, msg);
  } catch (err) {
    next(err);
  }
});

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const isAdmin = req.user.role === 'admin';
    let sqlText;
    const params = { userId };
    if (isAdmin && req.query.all === '1') {
      sqlText = `SELECT t.team_id, t.team_name, t.description, t.leader_id, t.created_at,
        u.real_name AS leader_name,
        (SELECT COUNT(*) FROM TeamMembers tm WHERE tm.team_id = t.team_id) AS member_count
        FROM Teams t LEFT JOIN Users u ON u.user_id = t.leader_id ORDER BY t.created_at DESC`;
    } else {
      sqlText = `SELECT t.team_id, t.team_name, t.description, t.leader_id, t.created_at,
        u.real_name AS leader_name,
        (SELECT COUNT(*) FROM TeamMembers tm2 WHERE tm2.team_id = t.team_id) AS member_count
        FROM Teams t
        JOIN TeamMembers tm ON tm.team_id = t.team_id AND tm.user_id = @userId
        LEFT JOIN Users u ON u.user_id = t.leader_id
        ORDER BY t.created_at DESC`;
    }
    const result = await query(sqlText, params);
    return success(res, result.recordset);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const teamId = parseInt(req.params.id, 10);
    const team = await query(
      `SELECT t.*, u.real_name AS leader_name FROM Teams t
       LEFT JOIN Users u ON u.user_id = t.leader_id WHERE t.team_id = @teamId`,
      { teamId }
    );
    if (!team.recordset.length) return fail(res, '团队不存在', 404, 404);
    const members = await query(
      `SELECT u.user_id, u.username, u.real_name, u.email, tm.joined_at
       FROM TeamMembers tm JOIN Users u ON u.user_id = tm.user_id WHERE tm.team_id = @teamId`,
      { teamId }
    );
    const tasks = await query(
      `SELECT t.task_id, t.title, t.description, t.status, t.assignee_id, t.creator_id, t.updated_at,
        a.real_name AS assignee_name
       FROM TeamTasks t LEFT JOIN Users a ON a.user_id = t.assignee_id
       WHERE t.team_id = @teamId ORDER BY t.updated_at DESC`,
      { teamId }
    );
    return success(res, {
      ...team.recordset[0],
      members: members.recordset,
      tasks: tasks.recordset,
    });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  requireAuth,
  requireRole('admin'),
  [body('team_name').trim().notEmpty(), body('leader_id').optional().isInt()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return fail(res, errors.array()[0].msg);
      const { team_name, description, leader_id } = req.body;
      const result = await query(
        `INSERT INTO Teams (team_name, description, leader_id) OUTPUT INSERTED.team_id
         VALUES (@team_name, @description, @leader_id)`,
        { team_name, description: description || null, leader_id: leader_id || null }
      );
      const teamId = result.recordset[0].team_id;
      if (leader_id) {
        await query(
          `IF NOT EXISTS (SELECT 1 FROM TeamMembers WHERE team_id = @teamId AND user_id = @leader_id)
           INSERT INTO TeamMembers (team_id, user_id) VALUES (@teamId, @leader_id)`,
          { teamId, leader_id }
        );
      }
      return success(res, { team_id: teamId }, '团队创建成功');
    } catch (err) {
      next(err);
    }
  }
);

router.put('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const teamId = parseInt(req.params.id, 10);
    const { team_name, description, leader_id } = req.body;
    await query(
      `UPDATE Teams SET team_name = COALESCE(@team_name, team_name),
       description = COALESCE(@description, description), leader_id = COALESCE(@leader_id, leader_id),
       updated_at = GETDATE() WHERE team_id = @teamId`,
      { teamId, team_name, description, leader_id }
    );
    return success(res, null, '更新成功');
  } catch (err) {
    next(err);
  }
});

router.post('/:id/members', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const teamId = parseInt(req.params.id, 10);
    const { user_id } = req.body;
    if (!user_id) return fail(res, '请指定用户');
    await query(
      `IF NOT EXISTS (SELECT 1 FROM TeamMembers WHERE team_id = @teamId AND user_id = @user_id)
       INSERT INTO TeamMembers (team_id, user_id) VALUES (@teamId, @user_id)`,
      { teamId, user_id }
    );
    return success(res, null, '成员添加成功');
  } catch (err) {
    next(err);
  }
});

router.delete('/:id/members/:userId', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    await query('DELETE FROM TeamMembers WHERE team_id = @teamId AND user_id = @userId', {
      teamId: parseInt(req.params.id, 10),
      userId: parseInt(req.params.userId, 10),
    });
    return success(res, null, '成员已移除');
  } catch (err) {
    next(err);
  }
});

router.post('/:id/join-request', requireAuth, async (req, res, next) => {
  try {
    const teamId = parseInt(req.params.id, 10);
    const userId = req.user.userId;
    const team = await query('SELECT team_id, team_name FROM Teams WHERE team_id = @teamId', { teamId });
    if (!team.recordset.length) return fail(res, '团队不存在', 404, 404);
    const member = await query(
      'SELECT 1 AS ok FROM TeamMembers WHERE team_id = @teamId AND user_id = @userId',
      { teamId, userId }
    );
    if (member.recordset.length) return fail(res, '您已在该团队中');
    const pending = await query(
      `SELECT 1 AS ok FROM TeamMembershipRequests
       WHERE team_id = @teamId AND user_id = @userId AND type = 'join' AND status = 'pending'`,
      { teamId, userId }
    );
    if (pending.recordset.length) return fail(res, '您已提交加入申请，请等待审核');
    await query(
      `INSERT INTO TeamMembershipRequests (team_id, user_id, type, status)
       VALUES (@teamId, @userId, 'join', 'pending')`,
      { teamId, userId }
    );
    return success(res, null, '加入申请已提交，请等待管理员审核');
  } catch (err) {
    next(err);
  }
});

router.post('/:id/exit-request', requireAuth, async (req, res, next) => {
  try {
    const teamId = parseInt(req.params.id, 10);
    const userId = req.user.userId;
    const member = await query(
      'SELECT 1 AS ok FROM TeamMembers WHERE team_id = @teamId AND user_id = @userId',
      { teamId, userId }
    );
    if (!member.recordset.length) return fail(res, '您不是该团队成员');
    const pending = await query(
      `SELECT 1 AS ok FROM TeamMembershipRequests
       WHERE team_id = @teamId AND user_id = @userId AND type = 'leave' AND status = 'pending'`,
      { teamId, userId }
    );
    if (pending.recordset.length) return fail(res, '您已提交退出申请，请等待审核');
    await query(
      `INSERT INTO TeamMembershipRequests (team_id, user_id, type, status)
       VALUES (@teamId, @userId, 'leave', 'pending')`,
      { teamId, userId }
    );
    return success(res, null, '退出申请已提交，审核中');
  } catch (err) {
    next(err);
  }
});

router.get('/:id/tasks', requireAuth, async (req, res, next) => {
  try {
    const teamId = parseInt(req.params.id, 10);
    const result = await query(
      `SELECT t.*, a.real_name AS assignee_name FROM TeamTasks t
       LEFT JOIN Users a ON a.user_id = t.assignee_id WHERE t.team_id = @teamId`,
      { teamId }
    );
    return success(res, result.recordset);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/tasks', requireAuth, async (req, res, next) => {
  try {
    const teamId = parseInt(req.params.id, 10);
    const canManage = await canManageTeam(req.user.userId, req.user.role, teamId);
    if (!canManage) return fail(res, '权限不足', 403, 403);
    const { title, description, assignee_id, status } = req.body;
    if (!title) return fail(res, '任务标题不能为空');
    const result = await query(
      `INSERT INTO TeamTasks (team_id, title, description, status, assignee_id, creator_id) OUTPUT INSERTED.*
       VALUES (@teamId, @title, @description, @status, @assignee_id, @creatorId)`,
      {
        teamId,
        title,
        description: description || null,
        status: status || 'todo',
        assignee_id: assignee_id || null,
        creatorId: req.user.userId,
      }
    );
    return success(res, result.recordset[0], '任务创建成功');
  } catch (err) {
    next(err);
  }
});

router.put('/:id/tasks/:taskId', requireAuth, async (req, res, next) => {
  try {
    const teamId = parseInt(req.params.id, 10);
    const taskId = parseInt(req.params.taskId, 10);
    const task = await query('SELECT * FROM TeamTasks WHERE task_id = @taskId AND team_id = @teamId', {
      taskId,
      teamId,
    });
    if (!task.recordset.length) return fail(res, '任务不存在', 404, 404);
    const row = task.recordset[0];
    const canManage = await canManageTeam(req.user.userId, req.user.role, teamId);
    const isAssignee = row.assignee_id === req.user.userId;
    if (!canManage && !isAssignee) return fail(res, '权限不足', 403, 403);
    const { title, description, status, assignee_id } = req.body;
    if (!canManage && (title || description || assignee_id)) {
      return fail(res, '仅负责人可修改任务详情', 403, 403);
    }
    await query(
      `UPDATE TeamTasks SET
       title = COALESCE(@title, title), description = COALESCE(@description, description),
       status = COALESCE(@status, status), assignee_id = COALESCE(@assignee_id, assignee_id),
       updated_at = GETDATE() WHERE task_id = @taskId`,
      { taskId, title, description, status, assignee_id }
    );
    return success(res, null, '任务更新成功');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
