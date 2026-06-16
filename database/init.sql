-- 创建数据库（仅需执行一次）
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'SDO_OA')
BEGIN
    CREATE DATABASE SDO_OA;
END
GO
