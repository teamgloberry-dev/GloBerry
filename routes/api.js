const express = require('express');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Get all projects
router.get('/projects', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.username as creator_name 
      FROM projects p 
      LEFT JOIN users u ON p.created_by = u.id 
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create project
router.post('/projects', authenticateToken, async (req, res) => {
  try {
    const { title, description, status = 'active' } = req.body;
    const result = await pool.query(
      'INSERT INTO projects (title, description, status, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, description, status, req.user.userId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get experiences for a project
router.get('/projects/:id/experiences', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*, u.username as author_name 
      FROM experiences e 
      LEFT JOIN users u ON e.user_id = u.id 
      WHERE e.project_id = $1 
      ORDER BY e.created_at DESC
    `, [req.params.id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create experience
router.post('/experiences', authenticateToken, async (req, res) => {
  try {
    const { project_id, title, content, tags, rating } = req.body;
    const result = await pool.query(
      'INSERT INTO experiences (project_id, user_id, title, content, tags, rating) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [project_id, req.user.userId, title, content, tags, rating]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get project statistics
router.get('/projects/:id/stats', async (req, res) => {
  try {
    const projectId = req.params.id;
    
    // Get experience count and average rating
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_experiences,
        COALESCE(AVG(rating), 0) as avg_rating,
        COUNT(DISTINCT user_id) as contributors
      FROM experiences 
      WHERE project_id = $1
    `, [projectId]);
    
    // Get recent activity (last 7 days)
    const recentResult = await pool.query(`
      SELECT COUNT(*) as recent_activity
      FROM experiences 
      WHERE project_id = $1 AND created_at > NOW() - INTERVAL '7 days'
    `, [projectId]);
    
    const stats = {
      ...statsResult.rows[0],
      recent_activity: recentResult.rows[0].recent_activity
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search projects
router.get('/projects/search', async (req, res) => {
  try {
    const { q, status } = req.query;
    let query = `
      SELECT p.*, u.username as creator_name 
      FROM projects p 
      LEFT JOIN users u ON p.created_by = u.id 
      WHERE 1=1
    `;
    const params = [];
    
    if (q) {
      params.push(`%${q}%`);
      query += ` AND (p.title ILIKE $${params.length} OR p.description ILIKE $${params.length} OR u.username ILIKE $${params.length})`;
    }
    
    if (status) {
      params.push(status);
      query += ` AND p.status = $${params.length}`;
    }
    
    query += ' ORDER BY p.created_at DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update project
router.put('/projects/:id', authenticateToken, async (req, res) => {
  try {
    const { title, description, status } = req.body;
    const projectId = req.params.id;
    
    // Check if user owns the project
    const ownerCheck = await pool.query(
      'SELECT created_by FROM projects WHERE id = $1',
      [projectId]
    );
    
    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    if (ownerCheck.rows[0].created_by !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to update this project' });
    }
    
    const result = await pool.query(
      'UPDATE projects SET title = $1, description = $2, status = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [title, description, status, projectId]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;