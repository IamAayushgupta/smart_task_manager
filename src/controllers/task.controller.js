import { supabase } from '../config/supabase.js';
import { classifyTask } from '../services/classification.service.js';
import { createTaskSchema } from '../validators/task.schema.js';
import { updateTaskSchema } from '../validators/task.schema.js';

export async function createTask(req, res) {
  try {
    // 1. Validate request
    const validatedData = createTaskSchema.parse(req.body);

    const { title, description, assigned_to, due_date } = validatedData;

    // 2. Run classification
    const classification = classifyTask(description);

    // 3. Insert task
    const { data: task, error } = await supabase
      .from('tasks')
      .insert([
        {
          title,
          description,
          assigned_to,
          due_date,
          category: classification.category,
          priority: classification.priority,
          extracted_entities: classification.extracted_entities,
          suggested_actions: classification.suggested_actions,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // 4. Insert task history
    await supabase.from('task_history').insert([
      {
        task_id: task.id,
        action: 'created',
        new_value: task,
        changed_by: assigned_to || 'system',
      },
    ]);

    // 5. Return response
    return res.status(201).json(task);

  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.errors,
      });
    }

    return res.status(500).json({
      message: 'Internal server error',
      error: error.message,
    });
  }
}

export async function getTasks(req, res) {
  try {
    const {
      status,
      category,
      priority,
      limit = 10,
      offset = 0,
    } = req.query;

    let query = supabase.from('tasks').select('*');

    if (status) query = query.eq('status', status);
    if (category) query = query.eq('category', category);
    if (priority) query = query.eq('priority', priority);

    const { data, error } = await query
      .range(Number(offset), Number(offset) + Number(limit) - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.json({
      count: data.length,
      data,
    });

  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch tasks',
      error: error.message,
    });
  }
}



export async function getTaskById(req, res) {
   console.log('🔥 getTaskById HIT');
  console.log('ID RECEIVED:', req.params.id);
  try {
    const { id } = req.params;

    // 1. Fetch task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (taskError || !task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // 2. Fetch task history
    const { data: history, error: historyError } = await supabase
      .from('task_history')
      .select('*')
      .eq('task_id', id)
      .order('changed_at', { ascending: false });

    if (historyError) throw historyError;

    // 3. Return combined response
    return res.json({
      task,
      history,
    });

  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch task',
      error: error.message,
    });
  }
}




export async function updateTask(req, res) {
  try {
    const { id } = req.params;

    // 1. Validate input
    const updates = updateTaskSchema.parse(req.body);

    // 2. Fetch existing task
    const { data: existingTask, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    let finalUpdates = { ...updates };

    // 3. Re-classify if description changed
    if (updates.description) {
      const classification = classifyTask(updates.description);
      finalUpdates.category = classification.category;
      finalUpdates.priority = classification.priority;
      finalUpdates.extracted_entities = classification.extracted_entities;
      finalUpdates.suggested_actions = classification.suggested_actions;
    }

    finalUpdates.updated_at = new Date();

    // 4. Update task
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update(finalUpdates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // 5. Save history
    await supabase.from('task_history').insert([
      {
        task_id: id,
        action: 'updated',
        old_value: existingTask,
        new_value: updatedTask,
        changed_by: updates.assigned_to || 'system',
      },
    ]);

    return res.json(updatedTask);

  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation failed', errors: error.errors });
    }

    return res.status(500).json({ message: 'Failed to update task', error: error.message });
  }
}

export async function deleteTask(req, res) {
  try {
    const { id } = req.params;

    // Fetch task for history
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Delete task
    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    // Save history
    await supabase.from('task_history').insert([
      {
        task_id: id,
        action: 'deleted',
        old_value: task,
        changed_by: 'system',
      },
    ]);

    return res.json({ message: 'Task deleted successfully' });

  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete task', error: error.message });
  }
}
