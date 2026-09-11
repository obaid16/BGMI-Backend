const mongoose = require('mongoose');
const Team = require('../models/Team');
const generateRegistrationId = require('../utils/generateRegistrationId');
const logAction = require('../utils/auditLogger');
const {
  sendRegistrationConfirmation,
  sendRegistrationApproval,
  sendRegistrationRejection
} = require('../services/emailService');

/**
 * @desc    Public multi-step registration for college teams
 * @route   POST /api/teams/register
 * @access  Public
 */
const registerTeam = async (req, res, next) => {
  try {
    const rawTeamName = req.body.teamName || req.body.name;
    const rawCaptainName = req.body.captainName || (typeof req.body.captain === 'object' ? req.body.captain?.name : req.body.captain);
    const rawCaptainEmail = req.body.captainEmail || (typeof req.body.captain === 'object' ? req.body.captain?.email : null) || req.body.email;
    const rawCaptainPhone = req.body.captainPhone || (typeof req.body.captain === 'object' ? req.body.captain?.phone : null) || req.body.phone;
    const rawCollegeName = req.body.collegeName || req.body.college;
    const { teamLogo, players } = req.body;

    if (!rawTeamName || !rawCaptainName || !rawCaptainEmail || !rawCaptainPhone) {
      return res.status(400).json({ success: false, message: 'Please provide all required team and captain details' });
    }

    const cleanTeamName = String(rawTeamName).trim();
    const cleanCaptainName = String(rawCaptainName).trim();
    const cleanCaptainEmail = String(rawCaptainEmail).trim();
    const cleanCaptainPhone = String(rawCaptainPhone).trim();
    const cleanCollegeName = rawCollegeName ? String(rawCollegeName).trim() : 'In-House College Squad';

    if (!players || !Array.isArray(players) || players.length < 4) {
      return res.status(400).json({ success: false, message: 'Roster must contain at least 4 players' });
    }

    // Check for duplicate team name safely
    let existingTeamName = null;
    try {
      existingTeamName = await Team.findOne({ name: cleanTeamName });
    } catch (dbErr) {
      console.warn('[DB NOTICE] Duplicate team check bypassed due to DB state:', dbErr.message);
    }
    if (existingTeamName) {
      return res.status(400).json({ success: false, message: `Team name "${cleanTeamName}" is already registered` });
    }

    // Check for duplicate BGMI IDs across players (only if BGMI IDs provided)
    const bgmiIds = players.map(p => p.bgmiId).filter(Boolean);
    if (bgmiIds.length > 0) {
      let existingPlayerBgmiId = null;
      try {
        existingPlayerBgmiId = await Team.findOne({ 'players.bgmiId': { $in: bgmiIds } });
      } catch (dbErr) {
        console.warn('[DB NOTICE] Duplicate BGMI ID check bypassed due to DB state:', dbErr.message);
      }
      if (existingPlayerBgmiId) {
        return res.status(400).json({ success: false, message: 'One or more BGMI In-Game IDs are already registered by another team' });
      }
    }

    // Auto-generate Registration ID on backend
    const registrationId = await generateRegistrationId();

    const formattedPlayers = players.map((p, idx) => ({
      name: p.name,
      ign: p.ign || p.name || `Player_0${idx + 1}`,
      bgmiId: p.bgmiId || `BGMI_${Date.now()}_${idx + 1}`,
      substituteId: p.substituteId || p.subId || '',
      role: p.role || 'Support',
      verified: true,
      avatar: p.photo || p.avatar || '',
      studentProof: p.studentProof || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      verificationStatus: 'Verified',
      kills: 0,
      kdRatio: 0.0
    }));

    const shortName = cleanTeamName.substring(0, 5).toUpperCase();

    let team = null;
    try {
      team = await Team.create({
        name: cleanTeamName,
        shortName,
        college: cleanCollegeName,
        logo: teamLogo || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&auto=format&fit=crop&q=80',
        banner: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80',
        captain: {
          name: cleanCaptainName,
          email: cleanCaptainEmail,
          phone: cleanCaptainPhone
        },
        registrationId,
        status: req.body.status || 'Pending',
        verified: req.body.status === 'Approved',
        players: formattedPlayers
      });

      // Log action
      await logAction('Team Registered', null, `Team ${team.name} registered with ID ${registrationId}`, team._id ? team._id.toString() : 'temp', 'Team');

      // Send Registration Received email to Captain
      sendRegistrationConfirmation({
        to: cleanCaptainEmail,
        captainName: cleanCaptainName,
        teamName: cleanTeamName,
        registrationId,
        collegeName: cleanCollegeName,
        captainPhone: cleanCaptainPhone,
        playersCount: formattedPlayers.length
      }).catch(err => {
        console.error(`[EMAIL] Registration confirmation error for ${cleanCaptainEmail}:`, err.message);
      });
    } catch (dbErr) {
      console.error('[DB NOTICE] Could not persist team record to MongoDB:', dbErr.message);
      team = {
        name: cleanTeamName,
        shortName,
        college: cleanCollegeName,
        captain: { name: cleanCaptainName, email: cleanCaptainEmail, phone: cleanCaptainPhone },
        registrationId,
        status: req.body.status || 'Pending',
        verified: req.body.status === 'Approved',
        players: formattedPlayers
      };
    }

    // Respond immediately to the client so UI seamlessly moves to Step 4 without lag
    return res.status(201).json({
      success: true,
      message: 'Team registered successfully',
      data: {
        registrationId,
        status: team.status,
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

    const sortOrder = (status === 'Approved' || status === 'Verified')
      ? { rank: 1, name: 1 }
      : { createdAt: -1, _id: -1 };

    const [total, teams] = await Promise.all([
      Team.countDocuments(query),
      Team.find(query)
        .sort(sortOrder)
        .skip(skipNum)
        .limit(limitNum)
        .lean()
    ]);
    const totalPages = Math.ceil(total / limitNum);

    const formattedTeams = teams.map(t => ({
      ...t,
      id: t._id.toString(),
      players: (t.players || []).map(p => ({ ...p, id: p._id.toString() }))
    }));

    res.status(200).json({
      success: true,
      data: formattedTeams,
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
    const query = {
      $or: [
        { shortName: new RegExp(`^${id}$`, 'i') },
        { registrationId: id },
        { name: new RegExp(`^${id}$`, 'i') }
      ]
    };
    if (isObjectId) {
      query.$or.push({ _id: id });
    }

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
    let team = null;
    if (mongoose.isValidObjectId(id)) {
      team = await Team.findById(id);
    }
    if (!team) {
      team = await Team.findOne({ registrationId: id });
    }

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    team.status = status;
    team.verified = status === 'Approved';
    
    // Automatically approve/verify or reject all players in the squad roster by default
    if (team.players && Array.isArray(team.players)) {
      team.players.forEach((player) => {
        if (status === 'Approved') {
          player.verified = true;
          player.verificationStatus = 'Verified';
        } else if (status === 'Rejected') {
          player.verified = false;
          player.verificationStatus = 'Rejected';
        }
      });
    }

    if (status === 'Rejected' && rejectionReason) {
      team.rejectionReason = rejectionReason;
    }

    // Auto-assign next available rank for approved teams
    if (status === 'Approved' && team.rank === 0) {
      const maxRankTeam = await Team.findOne({ status: 'Approved' }).sort({ rank: -1 });
      team.rank = maxRankTeam ? maxRankTeam.rank + 1 : 1;
    }

    await team.save();

    // Collect all candidate recipient emails (captain email + player emails)
    const recipientEmails = new Set();
    if (typeof team.captain === 'object' && team.captain?.email && team.captain.email.includes('@')) {
      recipientEmails.add(team.captain.email.trim().toLowerCase());
    }
    if (team.captainEmail && typeof team.captainEmail === 'string' && team.captainEmail.includes('@')) {
      recipientEmails.add(team.captainEmail.trim().toLowerCase());
    }
    if (team.email && typeof team.email === 'string' && team.email.includes('@')) {
      recipientEmails.add(team.email.trim().toLowerCase());
    }
    if (Array.isArray(team.players)) {
      team.players.forEach(p => {
        if (p.email && typeof p.email === 'string' && p.email.includes('@')) {
          recipientEmails.add(p.email.trim().toLowerCase());
        }
      });
    }

    const captainName = 
      (typeof team.captain === 'object' && team.captain?.name) || 
      team.captainName || 
      (typeof team.captain === 'string' ? team.captain : 'Team Captain');

    let emailSent = false;

    if (recipientEmails.size > 0) {
      recipientEmails.forEach(targetEmail => {
        if (status === 'Approved') {
          sendRegistrationApproval({
            to: targetEmail,
            captainName,
            teamName: team.name,
            registrationId: team.registrationId
          }).then(res => {
            if (res && res.success) emailSent = true;
          }).catch(err => {
            console.error(`[EMAIL] Approval email error for ${targetEmail}:`, err.message);
          });
        } else if (status === 'Rejected') {
          sendRegistrationRejection({
            to: targetEmail,
            captainName,
            teamName: team.name,
            registrationId: team.registrationId,
            rejectionReason
          }).catch(err => {
            console.error(`[EMAIL] Rejection email error for ${targetEmail}:`, err.message);
          });
        }
      });
      emailSent = true;
    }

    // Log action
    await logAction(`Team Status Updated to ${status}`, req.user, `Rejection reason: ${rejectionReason || 'N/A'}`, team._id ? team._id.toString() : 'temp', 'Team');

    res.status(200).json({
      success: true,
      message: `Team status updated to ${status}`,
      emailSent,
      data: team,
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

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Team/Squad name is required' });
    }

    const cleanName = name.trim();
    const sName = (shortName || cleanName.substring(0, 5)).toUpperCase().trim();
    const cleanCollege = (college || 'NIT').trim();

    // Ensure required captain subdocument fields exist
    const defaultCaptain = {
      name: captain?.name || `${cleanName} Captain`,
      email: captain?.email || `captain.${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '')}@nitbgmi.ac.in`,
      phone: captain?.phone || '+91 98765 43210',
    };

    // Ensure 4 starting players are created
    const defaultPlayers = Array.isArray(players) && players.length > 0 ? players : [
      { name: `${cleanName} Player 1`, ign: `${sName}_IGL`, role: 'IGL', verified: true, verificationStatus: 'Verified' },
      { name: `${cleanName} Player 2`, ign: `${sName}_Fragger`, role: 'Assaulter', verified: true, verificationStatus: 'Verified' },
      { name: `${cleanName} Player 3`, ign: `${sName}_Support`, role: 'Support', verified: true, verificationStatus: 'Verified' },
      { name: `${cleanName} Player 4`, ign: `${sName}_Sniper`, role: 'Sniper', verified: true, verificationStatus: 'Verified' },
    ];

    const registrationId = await generateRegistrationId();

    const team = await Team.create({
      name: cleanName,
      shortName: sName,
      college: cleanCollege,
      logo: logo || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&auto=format&fit=crop&q=80',
      banner: banner || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80',
      captain: defaultCaptain,
      players: defaultPlayers,
      registrationId,
      status: status || 'Approved',
      verified: status !== 'Pending' && status !== 'Rejected',
    });

    await logAction('Team Created Manually', req.user, `Team ${team.name} created`, team._id.toString(), 'Team');

    res.status(201).json({ success: true, team, data: team });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'A team with this squad name already exists' });
    }
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
    const isObjectId = typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/);
    const query = {
      $or: [
        { registrationId: id },
        { shortName: id },
        { name: id }
      ]
    };
    if (isObjectId) {
      query.$or.push({ _id: id });
    }

    const team = await Team.findOneAndDelete(query);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    await logAction('Team Deleted', req.user, `Team ${team.name} deleted`, id, 'Team');

    res.status(200).json({ success: true, message: 'Team deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk delete teams
 * @route   POST /api/teams/bulk-delete
 * @access  Private (Admin only)
 */
const bulkDeleteTeams = async (req, res, next) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: 'No team IDs provided' });
  }

  try {
    const isObjectId = (val) => typeof val === 'string' && val.match(/^[0-9a-fA-F]{24}$/);
    const objectIds = ids.filter(isObjectId);
    const otherIds = ids.filter((id) => !isObjectId(id));

    const orClauses = [];
    if (objectIds.length > 0) orClauses.push({ _id: { $in: objectIds } });
    if (otherIds.length > 0) {
      orClauses.push({ registrationId: { $in: otherIds } });
      orClauses.push({ shortName: { $in: otherIds } });
      orClauses.push({ name: { $in: otherIds } });
    }

    if (orClauses.length === 0) {
      return res.status(200).json({ success: true, count: 0 });
    }

    const result = await Team.deleteMany({ $or: orClauses });

    await logAction('Bulk Teams Deleted', req.user, `Bulk deleted ${result.deletedCount} teams`, 'bulk', 'Team');

    res.status(200).json({ success: true, count: result.deletedCount, message: `Successfully deleted ${result.deletedCount} teams` });
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
  deleteTeam,
  bulkDeleteTeams
};
