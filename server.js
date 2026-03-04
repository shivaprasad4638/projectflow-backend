const express = require('express');
const cors = require('cors');
const path = require('path');

const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/projects', projectRoutes);
app.use('/api', taskRoutes);

// Start server
app.listen(PORT, () => {
    console.log(`ProjectFlow API running at http://localhost:${PORT}`);
});
