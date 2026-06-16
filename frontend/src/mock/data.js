/** 前端 Mock 演示数据（无需后端/数据库） */

export const mockUsers = {
  admin: {
    user_id: 1,
    username: 'admin',
    email: 'admin@sdo.local',
    role: 'admin',
    status: 'active',
    real_name: '系统管理员',
    student_no: 'T001',
    phone: '13800000001',
    avatar: '',
    bio: '办公室管理员'
  },
  member1: {
    user_id: 2,
    username: 'member1',
    email: 'member1@sdo.local',
    role: 'member',
    status: 'active',
    real_name: '张三',
    student_no: '2021001',
    phone: '13800000002',
    avatar: '',
    bio: 'OA 开发组成员'
  }
}

export const mockAccounts = {
  admin: 'Admin@123',
  member1: 'Member@123',
  'admin@sdo.local': 'Admin@123',
  'member1@sdo.local': 'Member@123'
}

export const mockPendingUsers = [
  {
    user_id: 4,
    username: 'pending1',
    email: 'pending1@sdo.local',
    role: 'member',
    status: 'pending',
    real_name: '王五',
    student_no: '2021003',
    phone: '13800000004',
    created_at: '2025-06-01T10:00:00'
  }
]

export const mockAnnouncements = [
  {
    announcement_id: 1,
    title: '欢迎加入软件开发办公室',
    content: '请各位新成员及时完善个人信息，并查看课程学习板块。',
    publisher_name: '系统管理员',
    created_at: '2025-06-10T09:00:00'
  },
  {
    announcement_id: 2,
    title: '2025春季考核通知',
    content: '春季考核周期已开启，请各团队负责人配合完成成员评估。',
    publisher_name: '系统管理员',
    created_at: '2025-06-08T14:00:00'
  },
  {
    announcement_id: 3,
    title: 'Vue3 培训课程上线',
    content: '新课程《Vue3 前端开发入门》已发布，请成员自主学习。',
    publisher_name: '系统管理员',
    created_at: '2025-06-05T11:00:00'
  }
]

export const mockTeams = [
  {
    team_id: 1,
    team_name: 'OA系统开发组',
    description: '负责办公室内部管理系统的设计与开发',
    leader_id: 2,
    leader_name: '张三',
    member_count: 2,
    created_at: '2025-05-01T00:00:00',
    members: [
      { user_id: 2, username: 'member1', real_name: '张三', email: 'member1@sdo.local', joined_at: '2025-05-01' },
      { user_id: 3, username: 'member2', real_name: '李四', email: 'member2@sdo.local', joined_at: '2025-05-02' }
    ],
    tasks: [
      { task_id: 1, title: '完成登录模块', description: '实现用户登录、注册与 JWT 认证', status: 'done', assignee_id: 2, assignee_name: '张三', creator_id: 1, updated_at: '2025-06-12T10:00:00' },
      { task_id: 2, title: '开发仪表盘页面', description: '统计卡片与公告展示', status: 'doing', assignee_id: 2, assignee_name: '张三', creator_id: 1, updated_at: '2025-06-14T15:00:00' },
      { task_id: 3, title: '团队任务看板', description: '三列任务看板 UI', status: 'todo', assignee_id: 3, assignee_name: '李四', creator_id: 1, updated_at: '2025-06-14T16:00:00' }
    ]
  },
  {
    team_id: 2,
    team_name: 'NFC硬件制作组',
    description: '负责对打卡机等硬件的研发与维护',
    leader_id: 5,
    leader_name: '李一',
    member_count: 2,
    created_at: '2025-04-01T00:00:00',
    members: [
      { user_id: 5, username: 'member3', real_name: '李一', email: 'member3@sdo.local', joined_at: '2025-04-01' },
      { user_id: 6, username: 'member4', real_name: '赵六', email: 'member4@sdo.local', joined_at: '2025-04-05' }
    ],
    tasks: []
  },
  {
    team_id: 3,
    team_name: 'IT运维维护组',
    description: '负责服务器的运营维护和搭建',
    leader_id: 7,
    leader_name: '王二',
    member_count: 2,
    created_at: '2025-04-10T00:00:00',
    members: [
      { user_id: 7, username: 'member5', real_name: '王二', email: 'member5@sdo.local', joined_at: '2025-04-10' },
      { user_id: 8, username: 'member6', real_name: '孙七', email: 'member6@sdo.local', joined_at: '2025-04-12' }
    ],
    tasks: []
  }
]

/** 团队加入申请：pending | approved | rejected */
export const mockTeamJoinRequests = [
  {
    request_id: 1,
    team_id: 3,
    user_id: 2,
    user_name: '张三',
    team_name: 'IT运维维护组',
    status: 'pending',
    created_at: '2025-06-01T10:00:00'
  }
]

/** 团队退出申请 */
export const mockTeamLeaveRequests = []

export const mockPeriods = [
  {
    period_id: 1,
    title: '2025 春季考核',
    start_date: '2025-03-01',
    end_date: '2025-06-30',
    status: 'active',
    created_at: '2025-03-01T00:00:00'
  },
  {
    period_id: 2,
    title: '2024 秋季考核',
    start_date: '2024-09-01',
    end_date: '2024-12-31',
    status: 'closed',
    created_at: '2024-09-01T00:00:00'
  },
  {
    period_id: 3,
    title: '2023 春季考核',
    start_date: '2023-03-01',
    end_date: '2023-06-30',
    status: 'closed',
    created_at: '2023-03-01T00:00:00'
  },
  {
    period_id: 4,
    title: '2022 秋季考核',
    start_date: '2022-09-01',
    end_date: '2022-12-31',
    status: 'closed',
    created_at: '2022-09-01T00:00:00'
  }
]

export const mockScores = [
  {
    score_id: 1,
    period_id: 1,
    user_id: 2,
    period_title: '2025 春季考核',
    real_name: '张三',
    username: 'member1',
    student_no: '2021001',
    tech_score: 88,
    team_score: 90,
    attitude_score: 92,
    contribution_score: 85,
    comment: '技术扎实，团队协作良好',
    published: 1,
    avg_score: 88.75
  },
  {
    score_id: 2,
    period_id: 1,
    user_id: 3,
    period_title: '2025 春季考核',
    real_name: '李四',
    username: 'member2',
    student_no: '2021002',
    tech_score: 82,
    team_score: 88,
    attitude_score: 90,
    contribution_score: 80,
    comment: '进步明显，需加强项目贡献',
    published: 1,
    avg_score: 85
  },
  {
    score_id: 3,
    period_id: 2,
    user_id: 2,
    period_title: '2024 秋季考核',
    real_name: '张三',
    username: 'member1',
    student_no: '2021001',
    tech_score: 85,
    team_score: 88,
    attitude_score: 90,
    contribution_score: 82,
    comment: '项目推进稳定，技术能力持续提升',
    published: 1,
    avg_score: 86.25
  },
  {
    score_id: 4,
    period_id: 3,
    user_id: 2,
    period_title: '2023 春季考核',
    real_name: '张三',
    username: 'member1',
    student_no: '2021001',
    tech_score: 80,
    team_score: 85,
    attitude_score: 88,
    contribution_score: 78,
    comment: '学习态度积极，需加强独立开发能力',
    published: 1,
    avg_score: 82.75
  },
  {
    score_id: 5,
    period_id: 4,
    user_id: 2,
    period_title: '2022 秋季考核',
    real_name: '张三',
    username: 'member1',
    student_no: '2021001',
    tech_score: 75,
    team_score: 80,
    attitude_score: 85,
    contribution_score: 72,
    comment: '新人阶段表现良好，潜力较大',
    published: 1,
    avg_score: 78
  }
]

export const mockCourses = [
  {
    course_id: 1,
    title: 'Vue3 前端开发入门',
    category: '前端',
    description: 'Vue3 组合式 API、Vue Router、Pinia 基础',
    cover_url: null,
    difficulty: 'beginner',
    status: 'published',
    chapter_count: 3,
    learner_count: 2,
    my_progress: 67,
    chapters: [
      { chapter_id: 1, title: 'Vue3 简介', content: '## Vue3 简介\n\nVue3 是渐进式 JavaScript 框架，本章节介绍核心概念。', sort_order: 1, duration_min: 30, completed: 1 },
      { chapter_id: 2, title: '组合式 API', content: '## 组合式 API\n\n使用 setup() 与 ref/reactive 管理状态。', sort_order: 2, duration_min: 45, completed: 1 },
      { chapter_id: 3, title: 'Vue Router', content: '## Vue Router\n\n路由配置与导航守卫。', sort_order: 3, duration_min: 40, completed: 0 }
    ]
  },
  {
    course_id: 2,
    title: 'Node.js 后端开发',
    category: '后端',
    description: 'Express REST API 与 SQL Server 集成',
    cover_url: null,
    difficulty: 'intermediate',
    status: 'published',
    chapter_count: 2,
    learner_count: 1,
    my_progress: 0,
    chapters: [
      { chapter_id: 4, title: 'Express 基础', content: '## Express\n\n搭建 REST API 服务。', sort_order: 1, duration_min: 35, completed: 0 },
      { chapter_id: 5, title: '连接 SQL Server', content: '## mssql 驱动\n\n使用 mssql 包连接数据库。', sort_order: 2, duration_min: 50, completed: 0 }
    ]
  },
  {
    course_id: 3,
    title: '软件工程实践',
    category: '软工',
    description: '需求分析、UML 建模与测试方法',
    cover_url: null,
    difficulty: 'beginner',
    status: 'published',
    chapter_count: 2,
    learner_count: 1,
    my_progress: 50,
    chapters: [
      { chapter_id: 6, title: '需求分析', content: '## 需求分析\n\n用例图与 DFD 绘制方法。', sort_order: 1, duration_min: 40, completed: 1 },
      { chapter_id: 7, title: '软件测试', content: '## 测试\n\n单元测试与集成测试策略。', sort_order: 2, duration_min: 35, completed: 0 }
    ]
  }
]

export const mockActivities = [
  { type: 'assessment', title: '考核结果更新', detail: '2025 春季考核', time: '2025-06-10T10:00:00' },
  { type: 'task', title: '团队任务变更', detail: '开发仪表盘页面', time: '2025-06-14T15:00:00' },
  { type: 'learning', title: '课程进度更新', detail: '组合式 API', time: '2025-06-13T20:00:00' }
]

let nextTaskId = 10
let nextAnnouncementId = 10
let nextTeamRequestId = 10
let resetCode = '123456'

export function allocTeamRequestId() {
  return nextTeamRequestId++
}

export function getCurrentMockUserId() {
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  return user?.user_id || 2
}

export { nextTaskId, nextAnnouncementId, resetCode }
