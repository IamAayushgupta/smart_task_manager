import { z } from 'zod';

// 🔹 normalize human-readable status to DB-safe enum
const normalizeStatus = (value) => {
  if (!value) return value;

  const normalizedMap = {
    'pending': 'pending',
    'in progress': 'in_progress',
    'in_progress': 'in_progress',
    'completed': 'completed',
  };

  const normalized = normalizedMap[value.toLowerCase()];

  if (!normalized) {
    throw new Error('Invalid status value');
  }

  return normalized;
};

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  assigned_to: z.string().optional(),
  due_date: z.string().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  priority: z.string().optional(),

  // ✅ FIXED STATUS
  status: z
    .string()
    .transform(normalizeStatus)
    .refine(
      (val) => ['pending', 'in_progress', 'completed'].includes(val),
      { message: 'Invalid status value' }
    )
    .optional(),

  assigned_to: z.string().optional(),
  due_date: z.string().optional(),
});
