const Announcement = require('../models/Announcement');
const logAction = require('../utils/auditLogger');

/**
 * @desc    Get announcements list (published only for public)
 * @route   GET /api/announcements
 * @access  Public
 */
const getAnnouncements = async (req, res, next) => {
  const { published } = req.query;

  try {
    const query = {};
    if (published !== undefined) {
      query.published = published === 'true';
    } else {
      // Default to returning published announcements
      query.published = true;
    }

    // Sort by priority first (Urgent > High > Normal > Low) and then date descending
    const announcements = await Announcement.find(query).sort({ priority: 1, createdAt: -1 });
    res.status(200).json({ success: true, data: announcements });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create announcement
 * @route   POST /api/announcements
 * @access  Private (Admin only)
 */
const createAnnouncement = async (req, res, next) => {
  const { title, content, category, priority, published } = req.body;

  try {
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Please provide title and content' });
    }

    const ann = await Announcement.create({
      title,
      content,
      category: category || 'General',
      priority: priority || 'Normal',
      published: published !== undefined ? published : true,
      date: new Date().toISOString().split('T')[0]
    });

    await logAction('Announcement Created', req.user, `News "${title}" published under ${category}`, ann._id.toString(), 'Announcement');

    res.status(201).json({ success: true, data: ann });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update announcement
 * @route   PUT /api/announcements/:id
 * @access  Private (Admin only)
 */
const updateAnnouncement = async (req, res, next) => {
  const { id } = req.params;

  try {
    const ann = await Announcement.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

    if (!ann) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    await logAction('Announcement Updated', req.user, `Announcement "${ann.title}" modified`, id, 'Announcement');

    res.status(200).json({ success: true, data: ann });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete announcement
 * @route   DELETE /api/announcements/:id
 * @access  Private (Admin only)
 */
const deleteAnnouncement = async (req, res, next) => {
  const { id } = req.params;

  try {
    const ann = await Announcement.findByIdAndDelete(id);

    if (!ann) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    await logAction('Announcement Deleted', req.user, `Announcement "${ann.title}" deleted`, id, 'Announcement');

    res.status(200).json({ success: true, message: 'Announcement deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
};
