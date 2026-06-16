require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { getPool } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');
const announcementRoutes = require('./routes/announcements');
const teamRoutes = require('./routes/teams');
const assessmentRoutes = require('./routes/assessments');
const courseRoutes = require('./routes/courses');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/v1/health', async (req, res) => {
  try {
    await getPool();
    res.json({ code: 0, message: 'ok', data: { status: 'healthy' } });
  } catch (err) {
    res.status(503).json({ code: 503, message: '数据库连接失败', data: null });
  }
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/announcements', announcementRoutes);
app.use('/api/v1/teams', teamRoutes);
app.use('/api/v1/assessments', assessmentRoutes);
app.use('/api/v1/courses', courseRoutes);

app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`SDO OA API running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n端口 ${PORT} 已被占用。请先关闭旧的后端进程，或在 PowerShell 中执行：`);
    console.error(`  Get-NetTCPConnection -LocalPort ${PORT} | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }\n`);
    process.exit(1);
  }
  throw err;
});
