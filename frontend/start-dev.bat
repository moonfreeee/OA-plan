@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在启动前端开发服务器...
echo.
echo 若 npm 命令异常，本脚本会使用 npm.cmd 启动。
echo 启动成功后请访问终端显示的 Local 地址（默认 http://localhost:5173/）
echo 若端口被占用，Vite 会自动尝试 5174、5175 等端口
echo 按 Ctrl+C 可停止服务器
echo.
call npm.cmd run dev
if errorlevel 1 (
  echo.
  echo 启动失败，尝试直接使用 node 运行 vite...
  node node_modules\vite\bin\vite.js
)
pause
