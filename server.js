const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
require('dotenv').config();

const taskDB = require('./database');

// Configure multer for file uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed types: images, PDF, documents, text, zip'));
    }
  }
});
const { getWeatherForCity } = require('./weatherService');
const { hashPassword, generateToken, authenticateToken } = require('./auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// API Routes

// Authentication Routes

// POST /api/auth/register - Register new user
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    const passwordHash = hashPassword(password);
    const userId = taskDB.createUser(username, passwordHash);

    if (!userId) {
      return res.status(409).json({ success: false, error: 'Username already exists' });
    }

    const token = generateToken(userId, username);
    res.status(201).json({ 
      success: true, 
      data: { userId, username, token }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/auth/login - Login user
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required' });
    }

    const user = taskDB.getUserByUsername(username);
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const passwordHash = hashPassword(password);
    if (passwordHash !== user.password_hash) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = generateToken(user.id, user.username);
    res.json({ 
      success: true, 
      data: { userId: user.id, username: user.username, token }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/auth/me - Get current user (protected route example)
app.get('/api/auth/me', authenticateToken, (req, res) => {
  try {
    const user = taskDB.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({ 
      success: true, 
      data: { 
        userId: user.id, 
        username: user.username,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Task Routes (can be protected by adding authenticateToken middleware)

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

// File Upload Routes

// POST /api/tasks/:id/attachments - Upload file attachment for a task
app.post('/api/tasks/:id/attachments', upload.single('file'), (req, res) => {
  try {
    const taskId = req.params.id;
    const task = taskDB.getTaskById(taskId);
    
    if (!task) {
      // Delete uploaded file if task doesn't exist
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const attachmentId = taskDB.createAttachment(
      taskId,
      req.file.filename,
      req.file.originalname,
      req.file.path,
      req.file.size,
      req.file.mimetype
    );

    const attachment = taskDB.getAttachmentById(attachmentId);
    res.status(201).json({ success: true, data: attachment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/tasks/:id/attachments - Get all attachments for a task
app.get('/api/tasks/:id/attachments', (req, res) => {
  try {
    const taskId = req.params.id;
    const task = taskDB.getTaskById(taskId);
    
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const attachments = taskDB.getAttachmentsByTaskId(taskId);
    res.json({ success: true, data: attachments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/attachments/:id/download - Download attachment
app.get('/api/attachments/:id/download', (req, res) => {
  try {
    const attachment = taskDB.getAttachmentById(req.params.id);
    
    if (!attachment) {
      return res.status(404).json({ success: false, error: 'Attachment not found' });
    }

    if (!fs.existsSync(attachment.file_path)) {
      return res.status(404).json({ success: false, error: 'File not found on disk' });
    }

    res.download(attachment.file_path, attachment.original_name);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/attachments/:id - Delete attachment
app.delete('/api/attachments/:id', (req, res) => {
  try {
    const attachment = taskDB.getAttachmentById(req.params.id);
    
    if (!attachment) {
      return res.status(404).json({ success: false, error: 'Attachment not found' });
    }

    // Delete file from disk
    if (fs.existsSync(attachment.file_path)) {
      fs.unlinkSync(attachment.file_path);
    }

    // Delete database record
    taskDB.deleteAttachment(req.params.id);
    
    res.json({ success: true, message: 'Attachment deleted successfully' });
// Weather Integration

// GET /api/weather/:city - Get weather for a city
app.get('/api/weather/:city', async (req, res) => {
  try {
    const { city } = req.params;
    
    if (!city) {
      return res.status(400).json({ success: false, error: 'City is required' });
    }

    const weatherData = await getWeatherForCity(city);
    res.json({ success: true, data: weatherData });
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

