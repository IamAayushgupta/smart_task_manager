import express from 'express';
import cors from 'cors';
import taskRoutes from './routes/task.routes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', taskRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is healthy' });
});

export default app;
