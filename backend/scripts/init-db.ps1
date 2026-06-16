# 初始化 SDO_OA 数据库（需 SQL Server 已启动，sa 密码见 backend\.env）
$ErrorActionPreference = 'Stop'
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$db = Join-Path $root 'database'
$sqlcmd = 'C:\Program Files\Microsoft SQL Server\Client SDK\ODBC\170\Tools\Binn\SQLCMD.EXE'
if (-not (Test-Path $sqlcmd)) { $sqlcmd = 'sqlcmd' }

Write-Host '>> 创建数据库...'
& $sqlcmd -S localhost -E -i (Join-Path $db 'init.sql')
Write-Host '>> 创建表结构...'
& $sqlcmd -S localhost -E -d SDO_OA -i (Join-Path $db 'schema.sql')
Write-Host '>> 写入演示数据 (npm run reset-db，勿用 seed.sql 避免中文乱码)...'
Push-Location (Join-Path $root 'backend')
npm run reset-db
Pop-Location
Write-Host '>> 完成'
