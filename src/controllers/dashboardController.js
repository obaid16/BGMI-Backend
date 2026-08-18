const Team = require('../models/Team');
const Match = require('../models/Match');
const Media = require('../models/Media');
const AuditLog = require('../models/AuditLog');

/**
 * @desc    Get tournament summary stats for admin dashboard panel
 * @route   GET /api/admin/dashboard
 * @access  Private (Admin only)
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const totalTeams = await Team.countDocuments({});
    const approvedTeams = await Team.countDocuments({ status: 'Approved' });
    const pendingRegistrations = await Team.countDocuments({ status: 'Pending' });

    // Aggregate total players across all teams
    const playerStats = await Team.aggregate([
      {
        $project: {
          numPlayers: {
            $cond: {
              if: { $isArray: '$players' },
              then: { $size: '$players' },
              else: 0
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$numPlayers' }
        }
      }
    ]);
    const totalPlayers = playerStats.length > 0 ? playerStats[0].total : 0;

    const upcomingMatches = await Match.countDocuments({ status: 'Upcoming' });
    const liveMatches = await Match.countDocuments({ status: 'Live' });
    const completedMatches = await Match.countDocuments({ status: 'Completed' });

    // Pending proofs = Media POV or Screenshots in 'Pending Review'
    const pendingProofs = await Media.countDocuments({ status: 'Pending Review' });

    res.status(200).json({
      success: true,
      data: {
        totalTeams,
        approvedTeams,
        pendingRegistrations,
        totalPlayers,
        upcomingMatches,
        liveMatches,
        completedMatches,
        pendingProofs
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get audit logs history list
 * @route   GET /api/admin/audit-logs
 * @access  Private (Admin only)
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(100);
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Clear all demo tournament data across collections
 * @route   DELETE /api/admin/clear-demo-data
 * @access  Private (Admin only)
 */
const clearAllDemoData = async (req, res, next) => {
  try {
    const MatchResult = require('../models/MatchResult');
    const Announcement = require('../models/Announcement');

    await MatchResult.deleteMany({});
    await Match.deleteMany({});
    await Team.deleteMany({});
    await Media.deleteMany({});
    await Announcement.deleteMany({});
    await AuditLog.deleteMany({});

    res.status(200).json({
      success: true,
      message: 'All tournament demo data deleted successfully!'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getAuditLogs,
  clearAllDemoData
};
