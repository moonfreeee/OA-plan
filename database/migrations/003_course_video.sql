-- 课程视频 URL 字段
USE SDO_OA;
GO

IF COL_LENGTH('Courses', 'video_url') IS NULL
BEGIN
    ALTER TABLE Courses ADD video_url NVARCHAR(500) NULL;
END
GO
