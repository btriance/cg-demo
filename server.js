const express = require('express');
const path = require('path');
require('dotenv').config();

const taskDB = require('./database');
const cache = require('./cache');

// Initialize cache on startup
cache.initCache().catch(err => {
  console.warn('Cache initialization failed, continuing without cache:', err.message);
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// API Routes

// GET /api/tasks - Get all tasks (with caching)
app.get('/api/tasks', async (req, res) => {
  try {
    const cacheKey = 'tasks:all';
    
    // Try to get from cache first
    const cachedTasks = await cache.get(cacheKey);
    if (cachedTasks) {
      return res.json({ success: true, data: cachedTasks, cached: true });
    }

    // If not in cache, get from database
    const tasks = taskDB.getAllTasks();
    
    // Store in cache
    await cache.set(cacheKey, tasks);
    
    res.json({ success: true, data: tasks, cached: false });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/tasks/:id - Get task by ID (with caching)
app.get('/api/tasks/:id', async (req, res) => {
  try {
    const cacheKey = `tasks:${req.params.id}`;
    
    // Try to get from cache first
    const cachedTask = await cache.get(cacheKey);
    if (cachedTask) {
      return res.json({ success: true, data: cachedTask, cached: true });
    }

    const task = taskDB.getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    
    // Store in cache
    await cache.set(cacheKey, task);
    
    res.json({ success: true, data: task, cached: false });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/tasks - Create new task (invalidate cache)
app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description } = req.body;
    
    if (!title) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }

    const taskId = taskDB.createTask(title, description || '');
    const newTask = taskDB.getTaskById(taskId);
    
    // Invalidate cache
    await cache.clearPattern('tasks:*');
    
    res.status(201).json({ success: true, data: newTask });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/tasks/:id - Update task (invalidate cache)
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { title, description, status } = req.body;
    const task = taskDB.getTaskById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const updated = taskDB.updateTask(
      req.params.id,
      title || task.title,
      description !== undefined ? description : task.description,
      status || task.status
    );

    if (updated) {
      const updatedTask = taskDB.getTaskById(req.params.id);
      
      // Invalidate cache for this task and all tasks
      await cache.del(`tasks:${req.params.id}`);
      await cache.del('tasks:all');
      
      res.json({ success: true, data: updatedTask });
    } else {
      res.status(500).json({ success: false, error: 'Failed to update task' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/tasks/:id - Delete task (invalidate cache)
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const deleted = taskDB.deleteTask(req.params.id);
    
    if (deleted) {
      // Invalidate cache
      await cache.del(`tasks:${req.params.id}`);
      await cache.del('tasks:all');
      
      res.json({ success: true, message: 'Task deleted successfully' });
    } else {
      res.status(404).json({ success: false, error: 'Task not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cache Management Routes

// GET /api/cache/status - Get cache status
app.get('/api/cache/status', (req, res) => {
  const isReady = cache.isReady();
  res.json({ 
    success: true, 
    data: { 
      connected: isReady,
      message: isReady ? 'Cache is connected' : 'Cache is not connected'
    }
  });
});

// DELETE /api/cache/clear - Clear all cache
app.delete('/api/cache/clear', async (req, res) => {
  try {
    await cache.clearPattern('tasks:*');
    res.json({ success: true, message: 'Cache cleared successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Task Manager API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api/tasks`);
});

