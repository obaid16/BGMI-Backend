const Rule = require('../models/Rule');
const logAction = require('../utils/auditLogger');

/**
 * @desc    Get rules list (published only for public)
 * @route   GET /api/rules
 * @access  Public
 */
const getRules = async (req, res, next) => {
  const { published } = req.query;

  try {
    const query = {};
    if (published !== undefined) {
      query.published = published === 'true';
    } else {
      query.published = true;
    }

    const rules = await Rule.find(query).sort({ order: 1, createdAt: 1 });
    res.status(200).json({ success: true, data: rules });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create rule
 * @route   POST /api/rules
 * @access  Private (Admin only)
 */
const createRule = async (req, res, next) => {
  const { title, content, category, order, published } = req.body;

  try {
    if (!title || !content || !category) {
      return res.status(400).json({ success: false, message: 'Please provide title, category and content' });
    }

    const rule = await Rule.create({
      title,
      content,
      category,
      order: order !== undefined ? parseInt(order, 10) : 0,
      published: published !== undefined ? published : true
    });

    await logAction('Rule Created', req.user, `Rule "${title}" created in ${category}`, rule._id.toString(), 'Rule');

    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update rule
 * @route   PUT /api/rules/:id
 * @access  Private (Admin only)
 */
const updateRule = async (req, res, next) => {
  const { id } = req.params;

  try {
    const rule = await Rule.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

    if (!rule) {
      return res.status(404).json({ success: false, message: 'Rule not found' });
    }

    await logAction('Rule Updated', req.user, `Rule "${rule.title}" updated`, id, 'Rule');

    res.status(200).json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete rule
 * @route   DELETE /api/rules/:id
 * @access  Private (Admin only)
 */
const deleteRule = async (req, res, next) => {
  const { id } = req.params;

  try {
    const rule = await Rule.findByIdAndDelete(id);

    if (!rule) {
      return res.status(404).json({ success: false, message: 'Rule not found' });
    }

    await logAction('Rule Deleted', req.user, `Rule "${rule.title}" deleted`, id, 'Rule');

    res.status(200).json({ success: true, message: 'Rule deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRules,
  createRule,
  updateRule,
  deleteRule
};
