const express = require('express');
const cors = require('cors');
const auditLogRoutes = require('./src/routes/auditLog');

const app = express();

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'] }));
app.use(express.json());

// Mock session: X-Mock-User header selects the current user (default: admin)
app.use((req, _res, next) => {
  req.currentUser = req.headers['x-mock-user'] || 'admin';
  next();
});

app.use('/api/audit-log', auditLogRoutes);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Audit Log API running on http://localhost:${PORT}`));
