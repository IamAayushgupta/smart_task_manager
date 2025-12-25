import dotenv from 'dotenv';
import { deviceMiddleware } from './middlewares/device.middleware.js';

dotenv.config();

import app from './app.js';

const PORT = process.env.PORT || 5000;
app.use(deviceMiddleware);
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
