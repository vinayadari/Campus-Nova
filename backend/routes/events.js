const express = require('express');
const Event = require('../models/Event');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

// GET /api/events
router.get('/', async (req, res) => {
    try {
        const { type, tag, upcoming } = req.query;
        const filter = {};

        if (type) filter.type = type;
        if (tag) filter.tags = { $in: [tag] };
        if (upcoming === 'true') filter.date = { $gte: new Date() };

        const events = await Event.find(filter)
            .populate('organizer', 'name avatar')
            .populate('attendees', 'name avatar')
            .sort({ date: 1 });

        res.json(events);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/events
router.post('/', async (req, res) => {
    try {
        const { title, description, date, tags, type, location, maxAttendees, link } = req.body;

        if (!title || !description || !date) {
            return res.status(400).json({ error: 'Title, description, and date are required.' });
        }

        const event = await Event.create({
            title,
            description,
            date,
            organizer: req.user._id,
            attendees: [req.user._id],
            tags: tags || [],
            type: type || 'Other',
            location: location || 'Online',
            maxAttendees: maxAttendees || 50,
            link: link || '',
        });

        res.status(201).json(event);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/events/:id/rsvp
router.post('/:id/rsvp', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ error: 'Event not found.' });

        if (event.attendees.some((a) => a.equals(req.user._id))) {
            return res.status(400).json({ error: 'Already attending.' });
        }
        if (event.attendees.length >= event.maxAttendees) {
            return res.status(400).json({ error: 'Event is full.' });
        }

        event.attendees.push(req.user._id);
        await event.save();

        res.json(event);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/events/:id/rsvp
router.delete('/:id/rsvp', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ error: 'Event not found.' });

        event.attendees = event.attendees.filter((a) => !a.equals(req.user._id));
        await event.save();

        res.json(event);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
