import express from 'express';
import cors from 'cors';
import taskRoutes from './routes/task.routes.js';
import { deviceMiddleware } from './middlewares/device.middleware.js';

const app = express();

app.use(cors());
app.use(express.json());

// ✅ IMPORTANT: register device middleware BEFORE routes
app.use(deviceMiddleware);

// ✅ routes
app.use('/api', taskRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is healthy' });
});

export default app;
