const express = require('express');
const path = require('path');
require('dotenv').config();

const taskDB = require('./database');
const { sendTaskReminder, sendTestEmail, verifyConnection } = require('./emailService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// API Routes

// GET /api/tasks - Get all tasks
app.get('/api/tasks', (req, res) => {
  try {
    const tasks = taskDB.getAllTasks();
    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/tasks/:id - Get task by ID
app.get('/api/tasks/:id', (req, res) => {
  try {
    const task = taskDB.getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/tasks - Create new task
app.post('/api/tasks', (req, res) => {
  try {
    const { title, description } = req.body;
    
    if (!title) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }

    const taskId = taskDB.createTask(title, description || '');
    const newTask = taskDB.getTaskById(taskId);
    
    res.status(201).json({ success: true, data: newTask });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/tasks/:id - Update task
app.put('/api/tasks/:id', (req, res) => {
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
      res.json({ success: true, data: updatedTask });
    } else {
      res.status(500).json({ success: false, error: 'Failed to update task' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/tasks/:id - Delete task
app.delete('/api/tasks/:id', (req, res) => {
  try {
    const deleted = taskDB.deleteTask(req.params.id);
    
    if (deleted) {
      res.json({ success: true, message: 'Task deleted successfully' });
    } else {
      res.status(404).json({ success: false, error: 'Task not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Email Routes

// POST /api/tasks/:id/reminder - Send email reminder for a task
app.post('/api/tasks/:id/reminder', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email address is required' });
    }

    const task = taskDB.getTaskById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const result = await sendTaskReminder(email, task);
    
    res.json({ 
      success: true, 
      message: 'Reminder email sent successfully',
      messageId: result.messageId
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/email/test - Send test email
app.post('/api/email/test', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email address is required' });
    }

    const result = await sendTestEmail(email);
    
    res.json({ 
      success: true, 
      message: 'Test email sent successfully',
      messageId: result.messageId
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/email/verify - Verify email service connection
app.get('/api/email/verify', async (req, res) => {
  try {
    const isVerified = await verifyConnection();
    
    if (isVerified) {
      res.json({ success: true, message: 'Email service is configured correctly' });
    } else {
      res.status(500).json({ success: false, error: 'Email service verification failed' });
    }
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

