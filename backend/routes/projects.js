const express = require('express');
const Project = require('../models/Project');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

// GET /api/projects
router.get('/', async (req, res) => {
    try {
        const { tag, status, search } = req.query;
        const filter = {};

        if (tag) filter.tags = { $in: [tag] };
        if (status) filter.status = status;
        if (search) filter.title = { $regex: search, $options: 'i' };

        const projects = await Project.find(filter)
            .populate('owner', 'name avatar')
            .populate('members', 'name avatar')
            .sort({ createdAt: -1 });

        res.json(projects);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/projects
router.post('/', async (req, res) => {
    try {
        const { title, description, tags, skillsNeeded, maxMembers, deadline, githubRepo } = req.body;

        if (!title || !description) {
            return res.status(400).json({ error: 'Title and description are required.' });
        }

        const project = await Project.create({
            title,
            description,
            owner: req.user._id,
            members: [req.user._id],
            tags: tags || [],
            skillsNeeded: skillsNeeded || [],
            maxMembers: maxMembers || 5,
            deadline,
            githubRepo: githubRepo || '',
        });

        res.status(201).json(project);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/projects/:id/join
router.post('/:id/join', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ error: 'Project not found.' });

        if (project.members.some((m) => m.equals(req.user._id))) {
            return res.status(400).json({ error: 'Already a member.' });
        }
        if (project.members.length >= project.maxMembers) {
            return res.status(400).json({ error: 'Project is full.' });
        }

        project.members.push(req.user._id);
        await project.save();

        res.json(project);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/projects/:id
router.patch('/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ error: 'Project not found.' });

        if (!req.user._id.equals(project.owner)) {
            return res.status(403).json({ error: 'Forbidden.' });
        }

        const allowed = ['title', 'description', 'tags', 'skillsNeeded', 'status', 'maxMembers', 'deadline', 'githubRepo'];
        for (const key of allowed) {
            if (req.body[key] !== undefined) project[key] = req.body[key];
        }

        await project.save();
        res.json(project);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/projects/:id
router.delete('/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ error: 'Project not found.' });

        if (!req.user._id.equals(project.owner)) {
            return res.status(403).json({ error: 'Forbidden.' });
        }

        await project.deleteOne();
        res.json({ message: 'Project deleted.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
