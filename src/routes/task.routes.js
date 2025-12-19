import express from 'express';
import { createTask, getTasks } from '../controllers/task.controller.js';


const router = express.Router();

router.post('/tasks', createTask);
router.get('/tasks', getTasks);




export default router;
