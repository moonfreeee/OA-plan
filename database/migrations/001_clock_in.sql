-- 为已有 SDO_OA 库追加打卡表（新库请直接执行 schema.sql）
USE SDO_OA;
GO

IF OBJECT_ID('ClockInRecords', 'U') IS NULL
BEGIN
    CREATE TABLE ClockInRecords (
        record_id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL REFERENCES Users(user_id),
        clock_date DATE NOT NULL,
        clock_in_time DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT UQ_ClockIn_UserDate UNIQUE (user_id, clock_date)
    );
    CREATE INDEX IX_ClockInRecords_UserDate ON ClockInRecords(user_id, clock_date);
END
GO
