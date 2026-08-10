const AuditLog = require('../models/AuditLog');

/**
 * Creates an entry in the AuditLog collection
 * @param {string} action - The action string (e.g. 'Team Approved')
 * @param {object} user - The req.user context
 * @param {string} details - Additional description
 * @param {string} targetId - Document ID of target
 * @param {string} targetType - Category of target ('Team', 'Player', etc.)
 */
async function logAction(action, user, details = '', targetId = '', targetType = '') {
  try {
    const performedBy = user ? `${user.name} (${user.email})` : 'System / Public Registration';
    await AuditLog.create({
      action,
      performedBy,
      details,
      targetId,
      targetType
    });
  } catch (error) {
    console.error('Audit Logger Error:', error.message);
  }
}

module.exports = logAction;
