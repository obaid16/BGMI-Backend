const Team = require('../models/Team');
const generateRegistrationId = require('../utils/generateRegistrationId');
const logAction = require('../utils/auditLogger');

/**
 * @desc    Public multi-step registration for college teams
 * @route   POST /api/teams/register
 * @access  Public
 */
const registerTeam = async (req, res, next) => {
  try {
    const { teamName, collegeName, teamLogo, captainName, captainEmail, captainPhone, players } = req.body;

    if (!teamName || !collegeName || !captainName || !captainEmail || !captainPhone) {
      return res.status(400).json({ success: false, message: 'Please provide all required team and captain details' });
    }

    if (!players || !Array.isArray(players) || players.length < 4) {
      return res.status(400).json({ success: false, message: 'Roster must contain at least 4 players' });
    }

    // Check for duplicate team name
    const existingTeamName = await Team.findOne({ name: teamName });
    if (existingTeamName) {
      return res.status(400).json({ success: false, message: `Team name "${teamName}" is already registered` });
    }

    // Check for duplicate BGMI IDs across players
    const bgmiIds = players.map(p => p.bgmiId).filter(Boolean);
    const existingPlayerBgmiId = await Team.findOne({ 'players.bgmiId': { $in: bgmiIds } });
    if (existingPlayerBgmiId) {
      return res.status(400).json({ success: false, message: 'One or more BGMI In-Game IDs are already registered by another team' });
    }

    // Auto-generate Registration ID on backend
    const registrationId = await generateRegistrationId();

    const formattedPlayers = players.map((p, idx) => ({
      name: p.name,
      ign: p.ign,
      bgmiId: p.bgmiId,
      role: p.role || 'Support',
      verified: false,
      avatar: p.photo || p.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      studentProof: p.studentProof || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      verificationStatus: p.verificationStatus || 'Pending Verification',
      kills: 0,
      kdRatio: 0.0
    }));

    const shortName = teamName.substring(0, 5).toUpperCase();

    const team = await Team.create({
      name: teamName,
      shortName,
      college: collegeName,
      logo: teamLogo || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80',
      captain: {
        name: captainName,
        email: captainEmail,
        phone: captainPhone
      },
      registrationId,
      status: 'Pending',
      verified: false,
      players: formattedPlayers
    });

    // Log action
    await logAction('Team Registered', null, `Team ${team.name} registered with ID ${registrationId}`, team._id.toString(), 'Team');

    res.status(201).json({
      success: true,
      message: 'Team registered successfully',
      data: {
        registrationId,
        status: 'Pending',
        team
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all teams (supports pagination, search, status filtering)
 * @route   GET /api/teams
 * @access  Public
 */
const getTeams = async (req, res, next) => {
  const { status, search, page = 1, limit = 50 } = req.query;

  try {
    const query = {};

    // Filter by status if provided
    if (status) {
      if (status === 'Verified') {
        query.verified = true;
      } else {
        query.status = status;
      }
    }

    // Search query for team name or college or shortName
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { college: searchRegex },
        { shortName: searchRegex }
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skipNum = (pageNum - 1) * limitNum;

    const total = await Team.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum);

    const teams = await Team.find(query)
      .sort({ rank: 1, name: 1 })
      .skip(skipNum)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      data: teams,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get team by ID or registrationId
 * @route   GET /api/teams/:id
 * @access  Public
 */
const getTeamById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: id } : { registrationId: id };

    const team = await Team.findOne(query);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update team status (Approve, Reject, Under Review)
 * @route   PUT /api/teams/:id/status
 * @access  Private (Admin only)
 */
const updateTeamStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status, rejectionReason } = req.body;

  try {
    const team = await Team.findById(id);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    team.status = status;
    team.verified = status === 'Approved';
    
    if (status === 'Rejected' && rejectionReason) {
      team.rejectionReason = rejectionReason;
    }

    // Auto-assign next available rank for approved teams
    if (status === 'Approved' && team.rank === 0) {
      const maxRankTeam = await Team.findOne({ status: 'Approved' }).sort({ rank: -1 });
      team.rank = maxRankTeam ? maxRankTeam.rank + 1 : 1;
    }

    await team.save();

    // Log action
    await logAction(`Team Status Updated to ${status}`, req.user, `Rejection reason: ${rejectionReason || 'N/A'}`, team._id.toString(), 'Team');

    res.status(200).json({
      success: true,
      message: `Team status updated to ${status}`,
      team
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a team manually
 * @route   POST /api/teams
 * @access  Private (Admin only)
 */
const createTeam = async (req, res, next) => {
  try {
    const { name, shortName, college, logo, banner, captain, players, status } = req.body;

    const registrationId = await generateRegistrationId();

    const team = await Team.create({
      name,
      shortName: shortName || name.substring(0, 5).toUpperCase(),
      college,
      logo,
      banner,
      captain,
      players: players || [],
      registrationId,
      status: status || 'Approved',
      verified: status === 'Approved'
    });

    await logAction('Team Created Manually', req.user, `Team ${team.name} created`, team._id.toString(), 'Team');

    res.status(201).json({ success: true, team });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update team details manually
 * @route   PUT /api/teams/:id
 * @access  Private (Admin only)
 */
const updateTeam = async (req, res, next) => {
  const { id } = req.params;

  try {
    const team = await Team.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    await logAction('Team Details Updated', req.user, `Team ${team.name} updated details`, team._id.toString(), 'Team');

    res.status(200).json({ success: true, team });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete team profile
 * @route   DELETE /api/teams/:id
 * @access  Private (Admin only)
 */
const deleteTeam = async (req, res, next) => {
  const { id } = req.params;

  try {
    const team = await Team.findByIdAndDelete(id);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    await logAction('Team Deleted', req.user, `Team ${team.name} deleted`, id, 'Team');

    res.status(200).json({ success: true, message: 'Team deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerTeam,
  getTeams,
  getTeamById,
  updateTeamStatus,
  createTeam,
  updateTeam,
  deleteTeam
};
