import { supabase } from '../config/supabase.js';
import { classifyTask } from '../services/classification.service.js';
import { createTaskSchema, updateTaskSchema } from '../validators/task.schema.js';
import { extractIntentML } from '../services/intentML.service.js';

/* =====================================================
   CREATE TASK
===================================================== */
export async function createTask(req, res) {
  try {
    const validatedData = createTaskSchema.parse(req.body);
    const { title, description, assigned_to, due_date } = validatedData;

    // Rule-based classification
    let classification = classifyTask(description);

    // Optional ML enrichment
    try {
      const mlResult = await extractIntentML(description);

      if (mlResult?.priority) {
        classification.priority = mlResult.priority;
      }

      classification.extracted_entities = {
        ...classification.extracted_entities,
        ...mlResult,
      };
    } catch {
      console.warn('⚠️ ML unavailable, using rule-based classification');
    }

    // Insert task
    const { data: task, error } = await supabase
      .from('tasks')
      .insert([
        {
          title,
          description,
          assigned_to,
          due_date,
          device_id: req.deviceId, // ✅ DEVICE SCOPING
          category: classification.category,
          priority: classification.priority,
          extracted_entities: classification.extracted_entities,
          suggested_actions: classification.suggested_actions,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Insert history
    await supabase.from('task_history').insert([
      {
        task_id: task.id,
        device_id: req.deviceId, // ✅ DEVICE SCOPING
        action: 'created',
        new_value: task,
        changed_by: assigned_to || 'device',
      },
    ]);

    return res.status(201).json(task);
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to create task',
      error: error.message,
    });
  }
}

/* =====================================================
   GET TASKS
===================================================== */
export async function getTasks(req, res) {
  try {
    const { status, category, priority, limit = 10, offset = 0 } = req.query;

    let query = supabase
      .from('tasks')
      .select('*')
      .eq('device_id', req.deviceId); // ✅ FILTER BY DEVICE

    if (status) query = query.eq('status', status);
    if (category) query = query.eq('category', category);
    if (priority) query = query.eq('priority', priority);

    const { data, error } = await query
      .range(Number(offset), Number(offset) + Number(limit) - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.json({ count: data.length, data });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch tasks',
      error: error.message,
    });
  }
}

/* =====================================================
   GET TASK BY ID + HISTORY
===================================================== */
export async function getTaskById(req, res) {
  try {
    const { id } = req.params;

    const { data: task, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .eq('device_id', req.deviceId) // ✅ SECURITY
      .single();

    if (error || !task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const { data: history } = await supabase
      .from('task_history')
      .select('*')
      .eq('task_id', id)
      .eq('device_id', req.deviceId) // ✅ SECURITY
      .order('changed_at', { ascending: false });

    return res.json({ task, history });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch task',
      error: error.message,
    });
  }
}

/* =====================================================
   UPDATE TASK
===================================================== */
export async function updateTask(req, res) {
  try {
    const { id } = req.params;
    const updates = updateTaskSchema.parse(req.body);

    const { data: existingTask, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .eq('device_id', req.deviceId)
      .single();

    if (error || !existingTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    let finalUpdates = { ...updates };

    if (updates.description) {
      let classification = classifyTask(updates.description);

      try {
        const mlResult = await extractIntentML(updates.description);
        if (mlResult?.priority && !updates.priority) {
          classification.priority = mlResult.priority;
        }
        classification.extracted_entities = {
          ...classification.extracted_entities,
          ...mlResult,
        };
      } catch {}

      if (!updates.category) finalUpdates.category = classification.category;
      if (!updates.priority) finalUpdates.priority = classification.priority;

      finalUpdates.extracted_entities = classification.extracted_entities;
      finalUpdates.suggested_actions = classification.suggested_actions;
    }

    finalUpdates.updated_at = new Date();

    const { data: updatedTask } = await supabase
      .from('tasks')
      .update(finalUpdates)
      .eq('id', id)
      .eq('device_id', req.deviceId)
      .select()
      .single();

    await supabase.from('task_history').insert([
      {
        task_id: id,
        device_id: req.deviceId,
        action: 'updated',
        old_value: existingTask,
        new_value: updatedTask,
        changed_by: 'device',
      },
    ]);

    return res.json(updatedTask);
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to update task',
      error: error.message,
    });
  }
}

/* =====================================================
   DELETE TASK
===================================================== */
export async function deleteTask(req, res) {
  try {
    const { id } = req.params;

    const { data: task } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .eq('device_id', req.deviceId)
      .single();

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('device_id', req.deviceId);

    await supabase.from('task_history').insert([
      {
        task_id: id,
        device_id: req.deviceId,
        action: 'deleted',
        old_value: task,
        changed_by: 'device',
      },
    ]);

    return res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to delete task',
      error: error.message,
    });
  }
}
