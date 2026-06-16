@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在启动后端 API 服务器...
echo 启动成功后 API 地址: http://localhost:3000
echo 按 Ctrl+C 可停止服务器
echo.
call npm.cmd run dev
if errorlevel 1 (
  echo.
  echo 启动失败，尝试直接使用 node 运行...
  node --watch src\index.js
)
pause
