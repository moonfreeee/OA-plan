import {
  mockUsers,
  mockAccounts,
  mockPendingUsers,
  mockAnnouncements,
  mockTeams,
  mockPeriods,
  mockScores,
  mockCourses,
  mockActivities,
  mockTeamJoinRequests,
  mockTeamLeaveRequests,
  mockDynamicUsers,
  mockPasswordResetRequests,
  getCurrentMockUserId,
  allocTeamRequestId,
  allocUserId,
  allocResetRequestId
} from './data'
import { isClockedIn, setClockIn, getClockInTime } from './clockIn'
import { ElMessage } from 'element-plus'

function ok(data, message = 'ok') {
  return { code: 0, message, data }
}

function fail(message, code = 1) {
  const err = new Error(message)
  err.response = { data: { code, message, data: null }, status: code === 401 ? 401 : 400 }
  throw err
}

function delay(ms = 200) {
  return new Promise((r) => setTimeout(r, ms))
}

function parseBody(data) {
  if (!data) return {}
  if (typeof data === 'string') {
    try {
      return JSON.parse(data)
    } catch {
      return {}
    }
  }
  return data
}

function getTeamMembershipStatus(userId, teamId) {
  const team = mockTeams.find((t) => t.team_id === teamId)
  if (team?.members.some((m) => m.user_id === userId)) {
    const leavePending = mockTeamLeaveRequests.find(
      (r) => r.user_id === userId && r.team_id === teamId && r.status === 'pending'
    )
    if (leavePending) return 'exit_pending'
    return 'joined'
  }
  const joinPending = mockTeamJoinRequests.find(
    (r) => r.user_id === userId && r.team_id === teamId && r.status === 'pending'
  )
  if (joinPending) return 'pending'
  return 'none'
}

function filterByDate(items, dateField, { year, month, day }) {
  return items.filter((item) => {
    const d = item[dateField]
    if (!d) return false
    const [y, m, dd] = d.split('-').map(Number)
    if (year && y !== Number(year)) return false
    if (month && m !== Number(month)) return false
    if (day && dd !== Number(day)) return false
    return true
  })
}

export async function handleMock(config) {
  await delay()
  const method = (config.method || 'get').toLowerCase()
  const url = config.url || ''
  const params = config.params || {}
  const body = parseBody(config.data)

  // 认证
  if (method === 'post' && url === '/auth/login') {
    const { account, password } = body
    const pwd = mockAccounts[account]
    if (!pwd || pwd !== password) fail('用户名或密码错误', 401)
    if (account === 'pending1' || account === 'pending1@sdo.local') fail('账号待审核，请联系管理员', 403)
    const dynamic = mockDynamicUsers.find((u) => u.username === account || u.email === account)
    if (dynamic) return ok({ token: `mock-token-${dynamic.user_id}`, user: { ...dynamic } }, '登录成功')
    const userKey = account.includes('admin') ? 'admin' : 'member1'
    const user = { ...mockUsers[userKey] }
    return ok({ token: `mock-token-${userKey}`, user }, '登录成功')
  }

  if (method === 'post' && url === '/auth/password-reset-request') {
    const { account, new_password, confirm_password } = body
    if (new_password !== confirm_password) fail('两次密码不一致')
    const user =
      Object.values(mockUsers).find((u) => u.username === account || u.email === account) ||
      mockDynamicUsers.find((u) => u.username === account || u.email === account)
    if (!user) fail('账号不存在')
    if (user.status !== 'active') fail('账号状态异常，请联系管理员')
    if (mockPasswordResetRequests.some((r) => r.user_id === user.user_id && r.status === 'pending')) {
      fail('您已有待审核的密码找回申请，请耐心等待')
    }
    mockPasswordResetRequests.push({
      request_id: allocResetRequestId(),
      user_id: user.user_id,
      username: user.username,
      real_name: user.real_name,
      email: user.email,
      phone: user.phone,
      student_no: user.student_no,
      status: 'pending',
      new_password,
      created_at: new Date().toISOString()
    })
    return ok(null, '密码找回申请已提交，请等待管理员审核')
  }

  if (method === 'post' && url === '/auth/register') {
    fail('自助注册已关闭，请联系管理员创建账号')
  }

  // 用户
  if (method === 'get' && url === '/users/me') {
    const uid = getCurrentMockUserId()
    const user = uid === 1 ? mockUsers.admin : mockUsers.member1
    return ok({ ...user })
  }

  if (method === 'put' && url === '/users/me') {
    const uid = getCurrentMockUserId()
    const target = uid === 1 ? mockUsers.admin : mockUsers.member1
    Object.assign(target, body)
    return ok({ ...target }, '更新成功')
  }

  if (method === 'put' && url === '/users/me/password') {
    return ok(null, '密码修改成功')
  }

  if (method === 'get' && url === '/users/me/summary') {
    const uid = getCurrentMockUserId()
    const assessments = uid === 1 ? [] : mockScores.filter((s) => s.user_id === uid).map((s) => ({
      title: s.period_title,
      period_id: s.period_id,
      avg_score: s.avg_score,
      published: s.published
    }))
    const learning = mockCourses.map((c) => ({
      course_id: c.course_id,
      title: c.title,
      progress_pct: c.my_progress
    }))
    return ok({ assessments, learning })
  }

  if (method === 'get' && url === '/users/admin/users') {
    let list = [...mockDynamicUsers, mockUsers.member1].filter((u) => u.role === 'member' && u.status === 'active')
    if (params.role) list = list.filter((u) => u.role === params.role)
    if (params.status) list = list.filter((u) => u.status === params.status)
    return ok(list)
  }

  if (method === 'post' && url === '/users/admin/users') {
    const { username, email, password, real_name, phone, student_no } = body
    if (mockAccounts[username] || mockDynamicUsers.some((u) => u.username === username)) {
      fail('用户名或邮箱已存在')
    }
    const user = {
      user_id: allocUserId(),
      username,
      email,
      role: 'member',
      status: 'active',
      real_name,
      phone,
      student_no: student_no || null,
      created_at: new Date().toISOString()
    }
    mockDynamicUsers.push(user)
    mockAccounts[username] = password
    mockAccounts[email] = password
    return ok(user, '账号创建成功')
  }

  if (method === 'put' && url.match(/^\/users\/admin\/users\/\d+$/)) {
    const id = parseInt(url.split('/')[4], 10)
    const user = mockDynamicUsers.find((u) => u.user_id === id)
    if (!user) fail('用户不存在', 404)
    Object.assign(user, {
      real_name: body.real_name ?? user.real_name,
      phone: body.phone ?? user.phone,
      email: body.email ?? user.email,
      student_no: body.student_no ?? user.student_no
    })
    return ok(user, '更新成功')
  }

  if (method === 'delete' && url.match(/^\/users\/admin\/users\/\d+$/)) {
    const id = parseInt(url.split('/')[4], 10)
    const idx = mockDynamicUsers.findIndex((u) => u.user_id === id)
    if (idx < 0) fail('用户不存在', 404)
    const u = mockDynamicUsers[idx]
    delete mockAccounts[u.username]
    delete mockAccounts[u.email]
    mockDynamicUsers.splice(idx, 1)
    return ok(null, '账号已删除')
  }

  if (method === 'get' && url === '/users/admin/password-reset-requests') {
    const status = params.status || 'pending'
    const list = mockPasswordResetRequests.filter((r) => r.status === status)
    return ok(list)
  }

  if (method === 'put' && url.match(/^\/users\/admin\/password-reset-requests\/\d+$/)) {
    const requestId = parseInt(url.split('/')[4], 10)
    const reqItem = mockPasswordResetRequests.find((r) => r.request_id === requestId)
    if (!reqItem || reqItem.status !== 'pending') fail('申请不存在或已处理', 404)
    const action = body.action === 'reject' ? 'reject' : 'approve'
    reqItem.status = action === 'approve' ? 'approved' : 'rejected'
    reqItem.reviewed_at = new Date().toISOString()
    if (action === 'approve' && reqItem.new_password) {
      const user =
        Object.values(mockUsers).find((u) => u.user_id === reqItem.user_id) ||
        mockDynamicUsers.find((u) => u.user_id === reqItem.user_id)
      if (user) {
        mockAccounts[user.username] = reqItem.new_password
        mockAccounts[user.email] = reqItem.new_password
      }
    }
    return ok(null, action === 'approve' ? '已通过，员工可使用新密码登录' : '已拒绝该申请')
  }

  if (method === 'put' && url.match(/^\/users\/admin\/users\/\d+\/approve$/)) {
    const id = parseInt(url.split('/')[4], 10)
    const u = mockPendingUsers.find((x) => x.user_id === id)
    if (u) u.status = body.action
    return ok(null, body.action === 'active' ? '已通过审核' : '已拒绝')
  }

  // 仪表盘
  if (method === 'get' && url === '/dashboard/clock-in/today') {
    const records = Object.values(mockUsers)
      .filter((u) => u.status === 'active')
      .map((u) => ({
        user_id: u.user_id,
        username: u.username,
        real_name: u.real_name,
        student_no: u.student_no,
        role: u.role,
        clocked_in: isClockedIn(u.user_id),
        clock_in_time: getClockInTime(u.user_id),
      }))
      .sort((a, b) => Number(b.clocked_in) - Number(a.clocked_in))
    const clockedCount = records.filter((r) => r.clocked_in).length
    const d = new Date()
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return ok({
      date,
      total: records.length,
      clocked_count: clockedCount,
      absent_count: records.length - clockedCount,
      records,
    })
  }

  if (method === 'get' && url === '/dashboard/clock-in') {
    const userId = getCurrentMockUserId()
    return ok({ clockedIn: isClockedIn(userId), clockInTime: getClockInTime(userId) })
  }

  if (method === 'post' && url === '/dashboard/clock-in') {
    const userId = getCurrentMockUserId()
    if (isClockedIn(userId)) fail('今日已打卡')
    const time = setClockIn(userId)
    return ok({ clockedIn: true, clockInTime: time }, '打卡成功')
  }

  if (method === 'get' && url === '/dashboard/summary') {
    const uid = getCurrentMockUserId()
    const teams = uid === 1 ? mockTeams : mockTeams.filter((t) => t.members.some((m) => m.user_id === uid))
    const teamNames = teams.map((t) => t.team_name)
    const courseInProgress = mockCourses.filter((c) => c.my_progress > 0 && c.my_progress < 100).length
    const pendingCount = 0
    return ok({
      stats: {
        teamCount: teams.length,
        teamLabel: teamNames.length ? teamNames.join('、') : '暂无',
        courseInProgress,
        courseLabel: courseInProgress ? `${courseInProgress}门进行中` : '暂无',
        pendingAssessment: pendingCount,
        assessmentLabel: pendingCount ? `${pendingCount}项待完成` : '暂无',
        announcementCount: mockAnnouncements.length
      },
      announcements: mockAnnouncements.slice(0, 5),
      activities: mockActivities
    })
  }

  // 公告
  if (method === 'get' && url === '/announcements') {
    return ok(mockAnnouncements)
  }

  if (method === 'post' && url === '/announcements') {
    const item = {
      announcement_id: mockAnnouncements.length + 1,
      ...body,
      publisher_name: '系统管理员',
      created_at: new Date().toISOString()
    }
    mockAnnouncements.unshift(item)
    return ok(item, '公告发布成功')
  }

  if (method === 'put' && url.match(/^\/announcements\/\d+$/)) {
    const id = parseInt(url.split('/')[2], 10)
    const item = mockAnnouncements.find((a) => a.announcement_id === id)
    if (item) Object.assign(item, body)
    return ok(null, '更新成功')
  }

  if (method === 'delete' && url.match(/^\/announcements\/\d+$/)) {
    const id = parseInt(url.split('/')[2], 10)
    const idx = mockAnnouncements.findIndex((a) => a.announcement_id === id)
    if (idx >= 0) mockAnnouncements.splice(idx, 1)
    return ok(null, '删除成功')
  }

  // 团队
  if (method === 'get' && url === '/teams/overview') {
    const uid = getCurrentMockUserId()
    const list = mockTeams.map(({ members, tasks, ...t }) => ({
      ...t,
      membership_status: getTeamMembershipStatus(uid, t.team_id)
    }))
    return ok(list)
  }

  if (method === 'get' && url === '/teams/requests') {
    const status = params.status || 'pending'
    const join = mockTeamJoinRequests
      .filter((r) => !status || r.status === status)
      .map((r) => ({ ...r, type: 'join' }))
    const leave = mockTeamLeaveRequests
      .filter((r) => !status || r.status === status)
      .map((r) => ({ ...r, type: 'leave' }))
    return ok([...join, ...leave].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')))
  }

  if (method === 'put' && url.match(/^\/teams\/requests\/\d+$/)) {
    const requestId = parseInt(url.split('/')[3], 10)
    const action = body.action || 'approve'
    let reqItem =
      mockTeamJoinRequests.find((r) => r.request_id === requestId) ||
      mockTeamLeaveRequests.find((r) => r.request_id === requestId)
    if (!reqItem) fail('申请不存在', 404)
    if (reqItem.status !== 'pending') fail('该申请已处理')

    if (mockTeamJoinRequests.some((r) => r.request_id === requestId)) {
      if (action === 'approve') {
        reqItem.status = 'approved'
        const team = mockTeams.find((t) => t.team_id === reqItem.team_id)
        const user = Object.values(mockUsers).find((u) => u.user_id === reqItem.user_id)
        if (team && user && !team.members.some((m) => m.user_id === reqItem.user_id)) {
          team.members.push({
            user_id: user.user_id,
            username: user.username,
            real_name: user.real_name,
            email: user.email,
            joined_at: new Date().toISOString().slice(0, 10)
          })
          team.member_count = team.members.length
        }
      } else {
        reqItem.status = 'rejected'
      }
      return ok(null, action === 'approve' ? '加入申请已通过' : '加入申请已拒绝')
    }

    if (action === 'approve') {
      reqItem.status = 'approved'
      const team = mockTeams.find((t) => t.team_id === reqItem.team_id)
      if (team) {
        team.members = team.members.filter((m) => m.user_id !== reqItem.user_id)
        team.member_count = team.members.length
      }
    } else {
      reqItem.status = 'rejected'
    }
    return ok(null, action === 'approve' ? '退出申请已通过' : '退出申请已拒绝')
  }

  if (method === 'get' && url === '/teams') {
    const uid = getCurrentMockUserId()
    if (params.all === '1' || params.all === 1) {
      return ok(mockTeams.map(({ members, tasks, ...t }) => t))
    }
    const list = mockTeams.filter((t) => t.members.some((m) => m.user_id === uid))
    return ok(list.map(({ members, tasks, ...t }) => t))
  }

  if (method === 'get' && url.match(/^\/teams\/\d+$/)) {
    const id = parseInt(url.split('/')[2], 10)
    const team = mockTeams.find((t) => t.team_id === id)
    if (!team) fail('团队不存在', 404)
    return ok({ ...team })
  }

  if (method === 'post' && url === '/teams') {
    return ok({ team_id: mockTeams.length + 1 }, '团队创建成功')
  }

  if (method === 'put' && url.match(/^\/teams\/\d+$/)) {
    return ok(null, '更新成功')
  }

  if (method === 'post' && url.match(/^\/teams\/\d+\/members$/)) {
    return ok(null, '成员添加成功')
  }

  if (method === 'delete' && url.match(/^\/teams\/\d+\/members\/\d+$/)) {
    return ok(null, '成员已移除')
  }

  if (method === 'post' && url.match(/^\/teams\/\d+\/join-request$/)) {
    const teamId = parseInt(url.split('/')[2], 10)
    const uid = getCurrentMockUserId()
    const team = mockTeams.find((t) => t.team_id === teamId)
    if (!team) fail('团队不存在', 404)
    const status = getTeamMembershipStatus(uid, teamId)
    if (status === 'joined') fail('您已在该团队中')
    if (status === 'pending') fail('您已提交加入申请，请等待审核')
    const user = Object.values(mockUsers).find((u) => u.user_id === uid)
    mockTeamJoinRequests.push({
      request_id: allocTeamRequestId(),
      team_id: teamId,
      user_id: uid,
      user_name: user?.real_name || user?.username || '未知',
      team_name: team.team_name,
      status: 'pending',
      created_at: new Date().toISOString()
    })
    return ok(null, '加入申请已提交，请等待管理员审核')
  }

  if (method === 'post' && url.match(/^\/teams\/\d+\/exit-request$/)) {
    const teamId = parseInt(url.split('/')[2], 10)
    const uid = getCurrentMockUserId()
    const team = mockTeams.find((t) => t.team_id === teamId)
    if (!team) fail('团队不存在', 404)
    if (!team.members.some((m) => m.user_id === uid)) fail('您不是该团队成员')
    if (mockTeamLeaveRequests.some((r) => r.user_id === uid && r.team_id === teamId && r.status === 'pending')) {
      fail('您已提交退出申请，请等待审核')
    }
    const user = Object.values(mockUsers).find((u) => u.user_id === uid)
    mockTeamLeaveRequests.push({
      request_id: allocTeamRequestId(),
      team_id: teamId,
      user_id: uid,
      user_name: user?.real_name || user?.username || '未知',
      team_name: team.team_name,
      status: 'pending',
      created_at: new Date().toISOString()
    })
    return ok(null, '退出申请已提交，审核中')
  }

  if (method === 'post' && url.match(/^\/teams\/\d+\/tasks$/)) {
    const teamId = parseInt(url.split('/')[2], 10)
    const team = mockTeams.find((t) => t.team_id === teamId)
    const assignee = team?.members.find((m) => m.user_id === body.assignee_id)
    const task = {
      task_id: Date.now(),
      title: body.title,
      description: body.description,
      status: body.status || 'todo',
      assignee_id: body.assignee_id,
      assignee_name: assignee?.real_name || null,
      creator_id: getCurrentMockUserId(),
      updated_at: new Date().toISOString()
    }
    team?.tasks.unshift(task)
    return ok(task, '任务创建成功')
  }

  if (method === 'put' && url.match(/^\/teams\/\d+\/tasks\/\d+$/)) {
    const parts = url.split('/')
    const teamId = parseInt(parts[2], 10)
    const taskId = parseInt(parts[4], 10)
    const team = mockTeams.find((t) => t.team_id === teamId)
    const task = team?.tasks.find((t) => t.task_id === taskId)
    if (task) {
      Object.assign(task, body, { updated_at: new Date().toISOString() })
    }
    return ok(null, '任务更新成功')
  }

  // 考核
  if (method === 'get' && url === '/assessments/periods') {
    return ok(mockPeriods)
  }

  if (method === 'post' && url === '/assessments/periods') {
    return ok({ period_id: mockPeriods.length + 1, ...body }, '考核周期创建成功')
  }

  if (method === 'put' && url.match(/^\/assessments\/periods\/\d+$/)) {
    const id = parseInt(url.split('/')[3], 10)
    const p = mockPeriods.find((x) => x.period_id === id)
    if (p) Object.assign(p, body)
    return ok(null, '更新成功')
  }

  if (method === 'get' && url === '/assessments/my-scores') {
    const uid = getCurrentMockUserId()
    let scores = mockScores.filter((s) => s.user_id === uid && s.published)
    if (params.year || params.month || params.day) {
      const matchedPeriods = filterByDate(mockPeriods, 'end_date', params)
      const periodIds = new Set(matchedPeriods.map((p) => p.period_id))
      scores = scores.filter((s) => periodIds.has(s.period_id))
    }
    return ok(scores)
  }

  if (method === 'get' && url === '/assessments/periods/query') {
    let periods = [...mockPeriods]
    if (params.year || params.month || params.day) {
      periods = filterByDate(periods, 'end_date', params)
    }
    return ok(periods)
  }

  if (method === 'get' && url.match(/^\/assessments\/periods\/\d+\/scores$/)) {
    const periodId = parseInt(url.split('/')[3], 10)
    return ok(mockScores.filter((s) => s.period_id === periodId))
  }

  if (method === 'post' && url === '/assessments/scores') {
    return ok(null, '成绩保存成功')
  }

  if (method === 'put' && url.match(/^\/assessments\/scores\/\d+\/publish$/)) {
    return ok(null, '成绩已发布')
  }

  // 课程
  if (method === 'get' && url === '/courses/videos/demo') {
    return ok([
      {
        id: 'demo-mongodb-install',
        title: '9.2-1 MongoDB 安装与测试',
        filename: '9.2-1 MongoDBinstall_test.mp4',
        storageKey: 'demo-mongodb-install',
        url: '/uploads/videos/demo-mongodb-install.mp4',
        format: 'mp4',
        available: true,
        playable: true,
        preparing: false
      },
      {
        id: 'demo-query-data',
        title: '9.4-2 QueryData',
        filename: '9.4-2 QueryData.mp4',
        storageKey: 'demo-query-data',
        url: '/uploads/videos/demo-query-data.mp4',
        format: 'mp4',
        available: true,
        playable: true,
        preparing: false
      }
    ])
  }

  if (method === 'post' && url === '/courses/upload-video') {
    const name = body?.video?.name || 'demo.wmv'
    return ok({ url: `/uploads/videos/${name}`, filename: name, originalname: name }, '视频上传成功')
  }

  if (method === 'get' && url === '/courses') {
    return ok(mockCourses.map(({ chapters, ...c }) => c))
  }

  if (method === 'get' && url.match(/^\/courses\/\d+$/)) {
    const id = parseInt(url.split('/')[2], 10)
    const course = mockCourses.find((c) => c.course_id === id)
    if (!course) fail('课程不存在', 404)
    const total = course.chapters.length
    const done = course.chapters.filter((ch) => ch.completed).length
    return ok({ ...course, progress_pct: total ? Math.round((done / total) * 100) : 0 })
  }

  if (method === 'post' && url === '/courses') {
    return ok({ course_id: mockCourses.length + 1, ...body }, '课程创建成功')
  }

  if (method === 'put' && url.match(/^\/courses\/\d+$/)) {
    return ok(null, '更新成功')
  }

  if (method === 'delete' && url.match(/^\/courses\/\d+$/)) {
    return ok(null, '删除成功')
  }

  if (method === 'post' && url.match(/^\/courses\/\d+\/chapters$/)) {
    return ok({ chapter_id: Date.now(), ...body }, '章节添加成功')
  }

  if (method === 'put' && url.match(/^\/courses\/\d+\/chapters\/\d+$/)) {
    return ok(null, '章节更新成功')
  }

  if (method === 'delete' && url.match(/^\/courses\/\d+\/chapters\/\d+$/)) {
    return ok(null, '章节删除成功')
  }

  if (method === 'post' && url.match(/^\/courses\/chapters\/\d+\/complete$/)) {
    const chapterId = parseInt(url.split('/')[3], 10)
    for (const course of mockCourses) {
      const ch = course.chapters.find((c) => c.chapter_id === chapterId)
      if (ch) {
        ch.completed = 1
        const done = course.chapters.filter((c) => c.completed).length
        course.my_progress = Math.round((done / course.chapters.length) * 100)
      }
    }
    return ok(null, '已标记完成')
  }

  console.warn('[Mock] 未匹配的请求:', method, url)
  return ok({})
}

function createMockClient() {
  const invoke = async (config) => {
    try {
      return await handleMock(config)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || '请求失败'
      ElMessage.error(msg)
      return Promise.reject(err)
    }
  }

  const client = (config) => invoke(typeof config === 'string' ? { url: config } : config)

  ;['get', 'delete', 'head', 'options'].forEach((method) => {
    client[method] = (url, config = {}) => invoke({ ...config, method, url })
  })
  ;['post', 'put', 'patch'].forEach((method) => {
    client[method] = (url, data, config = {}) => invoke({ ...config, method, url, data })
  })

  return client
}

export default createMockClient
