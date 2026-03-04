const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');

const router = express.Router();

const VALID_STATUSES = ['todo', 'in-progress', 'done'];

// GET /api/projects/:id/tasks — Get all tasks for a project
router.get('/projects/:id/tasks', (req, res) => {
    try {
        const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(req.params.id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const tasks = db.prepare('SELECT * FROM tasks WHERE projectId = ? ORDER BY createdAt DESC')
            .all(req.params.id);
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// POST /api/projects/:id/tasks — Create a task in a project
router.post('/projects/:id/tasks', (req, res) => {
    try {
        const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(req.params.id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const { title } = req.body;
        if (!title || !title.trim()) {
            return res.status(400).json({ error: 'Task title is required' });
        }

        const task = {
            id: uuidv4(),
            title: title.trim(),
            status: 'todo',
            createdAt: new Date().toISOString(),
            projectId: req.params.id
        };

        db.prepare('INSERT INTO tasks (id, title, status, createdAt, projectId) VALUES (?, ?, ?, ?, ?)')
            .run(task.id, task.title, task.status, task.createdAt, task.projectId);

        res.status(201).json(task);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// PUT /api/tasks/:id — Update a task (title or status)
router.put('/tasks/:id', (req, res) => {
    try {
        const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const { title, status } = req.body;

        if (status && !VALID_STATUSES.includes(status)) {
            return res.status(400).json({ error: `Status must be one of: ${VALID_STATUSES.join(', ')}` });
        }

        const updated = {
            title: title !== undefined ? title.trim() : existing.title,
            status: status !== undefined ? status : existing.status
        };

        if (!updated.title) {
            return res.status(400).json({ error: 'Task title cannot be empty' });
        }

        db.prepare('UPDATE tasks SET title = ?, status = ? WHERE id = ?')
            .run(updated.title, updated.status, req.params.id);

        res.json({ ...existing, ...updated });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// DELETE /api/tasks/:id — Delete a task
router.delete('/tasks/:id', (req, res) => {
    try {
        const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'Task not found' });
        }

        db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
        res.json({ message: 'Task deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

module.exports = router;
