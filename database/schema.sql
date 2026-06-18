-- 软件开发办公室内部管理系统 - 数据库结构
-- 在 SSMS 中执行：先创建数据库 SDO_OA，再执行本脚本

USE SDO_OA;
GO

IF OBJECT_ID('LearningProgress', 'U') IS NOT NULL DROP TABLE LearningProgress;
IF OBJECT_ID('ClockInRecords', 'U') IS NOT NULL DROP TABLE ClockInRecords;
IF OBJECT_ID('CourseChapters', 'U') IS NOT NULL DROP TABLE CourseChapters;
IF OBJECT_ID('Courses', 'U') IS NOT NULL DROP TABLE Courses;
IF OBJECT_ID('AssessmentScores', 'U') IS NOT NULL DROP TABLE AssessmentScores;
IF OBJECT_ID('AssessmentPeriods', 'U') IS NOT NULL DROP TABLE AssessmentPeriods;
IF OBJECT_ID('TeamTasks', 'U') IS NOT NULL DROP TABLE TeamTasks;
IF OBJECT_ID('TeamMembershipRequests', 'U') IS NOT NULL DROP TABLE TeamMembershipRequests;
IF OBJECT_ID('TeamMembers', 'U') IS NOT NULL DROP TABLE TeamMembers;
IF OBJECT_ID('Teams', 'U') IS NOT NULL DROP TABLE Teams;
IF OBJECT_ID('Announcements', 'U') IS NOT NULL DROP TABLE Announcements;
IF OBJECT_ID('PasswordResetRequests', 'U') IS NOT NULL DROP TABLE PasswordResetRequests;
IF OBJECT_ID('PasswordResetCodes', 'U') IS NOT NULL DROP TABLE PasswordResetCodes;
IF OBJECT_ID('Users', 'U') IS NOT NULL DROP TABLE Users;
GO

CREATE TABLE Users (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(50) NOT NULL UNIQUE,
    email NVARCHAR(100) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    role NVARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    status NVARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected')),
    real_name NVARCHAR(50) NULL,
    student_no NVARCHAR(30) NULL,
    phone NVARCHAR(20) NULL,
    avatar NVARCHAR(500) NULL,
    bio NVARCHAR(500) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
);

CREATE TABLE PasswordResetCodes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    email NVARCHAR(100) NOT NULL,
    code NVARCHAR(10) NOT NULL,
    expires_at DATETIME2 NOT NULL,
    used BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE()
);

CREATE TABLE PasswordResetRequests (
    request_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL REFERENCES Users(user_id),
    new_password_hash NVARCHAR(255) NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    reviewed_at DATETIME2 NULL,
    reviewer_id INT NULL REFERENCES Users(user_id)
);

CREATE TABLE Announcements (
    announcement_id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(200) NOT NULL,
    content NVARCHAR(MAX) NOT NULL,
    publisher_id INT NOT NULL REFERENCES Users(user_id),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
);

CREATE TABLE Teams (
    team_id INT IDENTITY(1,1) PRIMARY KEY,
    team_name NVARCHAR(100) NOT NULL,
    description NVARCHAR(MAX) NULL,
    leader_id INT NULL REFERENCES Users(user_id),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
);

CREATE TABLE TeamMembers (
    id INT IDENTITY(1,1) PRIMARY KEY,
    team_id INT NOT NULL REFERENCES Teams(team_id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES Users(user_id),
    joined_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT UQ_TeamMember UNIQUE (team_id, user_id)
);

CREATE TABLE TeamMembershipRequests (
    request_id INT IDENTITY(1,1) PRIMARY KEY,
    team_id INT NOT NULL REFERENCES Teams(team_id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES Users(user_id),
    type NVARCHAR(10) NOT NULL CHECK (type IN ('join', 'leave')),
    status NVARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    reviewed_at DATETIME2 NULL,
    reviewer_id INT NULL REFERENCES Users(user_id)
);

CREATE TABLE TeamTasks (
    task_id INT IDENTITY(1,1) PRIMARY KEY,
    team_id INT NOT NULL REFERENCES Teams(team_id) ON DELETE CASCADE,
    title NVARCHAR(200) NOT NULL,
    description NVARCHAR(MAX) NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'done')),
    assignee_id INT NULL REFERENCES Users(user_id),
    creator_id INT NOT NULL REFERENCES Users(user_id),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
);

CREATE TABLE AssessmentPeriods (
    period_id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(200) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
);

CREATE TABLE AssessmentScores (
    score_id INT IDENTITY(1,1) PRIMARY KEY,
    period_id INT NOT NULL REFERENCES AssessmentPeriods(period_id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES Users(user_id),
    tech_score INT NULL CHECK (tech_score BETWEEN 0 AND 100),
    team_score INT NULL CHECK (team_score BETWEEN 0 AND 100),
    attitude_score INT NULL CHECK (attitude_score BETWEEN 0 AND 100),
    contribution_score INT NULL CHECK (contribution_score BETWEEN 0 AND 100),
    comment NVARCHAR(500) NULL,
    published BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT UQ_AssessmentScore UNIQUE (period_id, user_id)
);

CREATE TABLE Courses (
    course_id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(200) NOT NULL,
    category NVARCHAR(50) NOT NULL,
    description NVARCHAR(MAX) NULL,
    cover_url NVARCHAR(500) NULL,
    video_url NVARCHAR(500) NULL,
    difficulty NVARCHAR(20) NOT NULL DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    status NVARCHAR(20) NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
);

CREATE TABLE CourseChapters (
    chapter_id INT IDENTITY(1,1) PRIMARY KEY,
    course_id INT NOT NULL REFERENCES Courses(course_id) ON DELETE CASCADE,
    title NVARCHAR(200) NOT NULL,
    content NVARCHAR(MAX) NULL,
    sort_order INT NOT NULL DEFAULT 0,
    duration_min INT NOT NULL DEFAULT 30,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
);

CREATE TABLE LearningProgress (
    progress_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL REFERENCES Users(user_id),
    chapter_id INT NOT NULL REFERENCES CourseChapters(chapter_id) ON DELETE CASCADE,
    completed_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT UQ_LearningProgress UNIQUE (user_id, chapter_id)
);

CREATE TABLE ClockInRecords (
    record_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL REFERENCES Users(user_id),
    clock_date DATE NOT NULL,
    clock_in_time DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT UQ_ClockIn_UserDate UNIQUE (user_id, clock_date)
);

CREATE INDEX IX_Users_Username ON Users(username);
CREATE INDEX IX_Users_Email ON Users(email);
CREATE INDEX IX_TeamMembers_TeamUser ON TeamMembers(team_id, user_id);
CREATE INDEX IX_AssessmentScores_PeriodUser ON AssessmentScores(period_id, user_id);
CREATE INDEX IX_LearningProgress_UserChapter ON LearningProgress(user_id, chapter_id);
CREATE INDEX IX_PasswordResetCodes_Email ON PasswordResetCodes(email);
CREATE INDEX IX_PasswordResetRequests_Status ON PasswordResetRequests(status, created_at DESC);
CREATE INDEX IX_ClockInRecords_UserDate ON ClockInRecords(user_id, clock_date);
GO
