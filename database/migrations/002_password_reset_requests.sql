USE SDO_OA;
GO

IF OBJECT_ID('PasswordResetRequests', 'U') IS NULL
BEGIN
    CREATE TABLE PasswordResetRequests (
        request_id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL REFERENCES Users(user_id),
        new_password_hash NVARCHAR(255) NOT NULL,
        status NVARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        reviewed_at DATETIME2 NULL,
        reviewer_id INT NULL REFERENCES Users(user_id)
    );
    CREATE INDEX IX_PasswordResetRequests_Status ON PasswordResetRequests(status, created_at DESC);
END
GO
