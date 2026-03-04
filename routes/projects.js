const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');

const router = express.Router();

// GET /api/projects — List all projects
router.get('/', (req, res) => {
    try {
        const projects = db.prepare(`
      SELECT p.*, COUNT(t.id) as taskCount
      FROM projects p
      LEFT JOIN tasks t ON t.projectId = p.id
      GROUP BY p.id
      ORDER BY p.createdAt DESC
    `).all();
        res.json(projects);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// POST /api/projects — Create a project
router.post('/', (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Project name is required' });
        }

        const project = {
            id: uuidv4(),
            name: name.trim(),
            description: (description || '').trim(),
            createdAt: new Date().toISOString()
        };

        db.prepare('INSERT INTO projects (id, name, description, createdAt) VALUES (?, ?, ?, ?)')
            .run(project.id, project.name, project.description, project.createdAt);

        res.status(201).json(project);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// GET /api/projects/:id — Get single project
router.get('/:id', (req, res) => {
    try {
        const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json(project);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});

// PUT /api/projects/:id — Update project
router.put('/:id', (req, res) => {
    try {
        const { name, description } = req.body;
        const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const updated = {
            name: name !== undefined ? name.trim() : existing.name,
            description: description !== undefined ? description.trim() : existing.description
        };

        if (!updated.name) {
            return res.status(400).json({ error: 'Project name cannot be empty' });
        }

        db.prepare('UPDATE projects SET name = ?, description = ? WHERE id = ?')
            .run(updated.name, updated.description, req.params.id);

        res.json({ ...existing, ...updated });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update project' });
    }
});

// DELETE /api/projects/:id — Delete project (cascades to tasks)
router.delete('/:id', (req, res) => {
    try {
        const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'Project not found' });
        }

        db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
        res.json({ message: 'Project deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

module.exports = router;
