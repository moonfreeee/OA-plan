-- 演示数据（需先执行 schema.sql）
USE SDO_OA;
GO

-- 密码: admin/Admin@123, member1/Member@123, pending1/Pending@123
INSERT INTO Users (username, email, password_hash, role, status, real_name, student_no, phone) VALUES
('admin', 'admin@sdo.local', '$2b$10$Y6.Mun4/M46Zd7hN4S4Mjes3YwY7DaP1akgeDvRLOMKOYVIaxoyX6', 'admin', 'active', N'系统管理员', 'T001', '13800000001'),
('member1', 'member1@sdo.local', '$2b$10$g4MRpBm08iBvI49VAndXEubf1DNJ1ExkqrH48R.ZsBlMDi7WGljIm', 'member', 'active', N'张三', '2021001', '13800000002'),
('member2', 'member2@sdo.local', '$2b$10$g4MRpBm08iBvI49VAndXEubf1DNJ1ExkqrH48R.ZsBlMDi7WGljIm', 'member', 'active', N'李四', '2021002', '13800000003'),
('pending1', 'pending1@sdo.local', '$2b$10$dekpmOZwUNiaqVaRN8OCoOWIaOf4KboLzuOzQfzTPKCdJiAWJxbFu', 'member', 'pending', N'王五', '2021003', '13800000004');
GO

INSERT INTO Announcements (title, content, publisher_id) VALUES
(N'欢迎加入软件开发办公室', N'请各位新成员及时完善个人信息，并查看课程学习板块。', 1),
(N'2025春季考核通知', N'春季考核周期已开启，请各团队负责人配合完成成员评估。', 1),
(N'Vue3 培训课程上线', N'新课程《Vue3 前端开发入门》已发布，请成员自主学习。', 1);
GO

INSERT INTO Teams (team_name, description, leader_id) VALUES
(N'OA系统开发组', N'负责办公室内部管理系统的设计与开发', 2),
(N'算法研究组', N'负责算法竞赛与论文研究', 3);
GO

INSERT INTO TeamMembers (team_id, user_id) VALUES
(1, 2), (1, 3), (2, 3);
GO

INSERT INTO TeamTasks (team_id, title, description, status, assignee_id, creator_id) VALUES
(1, N'完成登录模块', N'实现用户登录、注册与 JWT 认证', 'done', 2, 1),
(1, N'开发仪表盘页面', N'统计卡片与公告展示', 'doing', 2, 1),
(1, N'团队任务看板', N'三列任务看板 UI', 'todo', 3, 1),
(2, N'算法题集整理', N'整理竞赛常用算法模板', 'doing', 3, 1);
GO

INSERT INTO AssessmentPeriods (title, start_date, end_date, status) VALUES
(N'2025 春季考核', '2025-03-01', '2025-06-30', 'active');
GO

INSERT INTO AssessmentScores (period_id, user_id, tech_score, team_score, attitude_score, contribution_score, comment, published) VALUES
(1, 2, 88, 90, 92, 85, N'技术扎实，团队协作良好', 1),
(1, 3, 82, 88, 90, 80, N'进步明显，需加强项目贡献', 1);
GO

INSERT INTO Courses (title, category, description, cover_url, difficulty, status) VALUES
(N'Vue3 前端开发入门', N'前端', N'Vue3 组合式 API、Vue Router、Pinia 基础', NULL, 'beginner', 'published'),
(N'Node.js 后端开发', N'后端', N'Express REST API 与 SQL Server 集成', NULL, 'intermediate', 'published'),
(N'软件工程实践', N'软工', N'需求分析、UML 建模与测试方法', NULL, 'beginner', 'published');
GO

INSERT INTO CourseChapters (course_id, title, content, sort_order, duration_min) VALUES
(1, N'Vue3 简介', N'## Vue3 简介\n\nVue3 是渐进式 JavaScript 框架，本章节介绍核心概念。', 1, 30),
(1, N'组合式 API', N'## 组合式 API\n\n使用 setup() 与 ref/reactive 管理状态。', 2, 45),
(1, N'Vue Router', N'## Vue Router\n\n路由配置与导航守卫。', 3, 40),
(2, N'Express 基础', N'## Express\n\n搭建 REST API 服务。', 1, 35),
(2, N'连接 SQL Server', N'## mssql 驱动\n\n使用 mssql 包连接数据库。', 2, 50),
(3, N'需求分析', N'## 需求分析\n\n用例图与 DFD 绘制方法。', 1, 40),
(3, N'软件测试', N'## 测试\n\n单元测试与集成测试策略。', 2, 35);
GO

INSERT INTO LearningProgress (user_id, chapter_id) VALUES
(2, 1), (2, 2), (3, 1);
GO
