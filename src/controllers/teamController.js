const Team = require('../models/Team');
const generateRegistrationId = require('../utils/generateRegistrationId');
const logAction = require('../utils/auditLogger');
const sendEmail = require('../utils/sendEmail');

/**
 * @desc    Public multi-step registration for college teams
 * @route   POST /api/teams/register
 * @access  Public
 */
const registerTeam = async (req, res, next) => {
  try {
    const { teamName, collegeName, teamLogo, captainName, captainEmail, captainPhone, players } = req.body;

    if (!teamName || !captainName || !captainEmail || !captainPhone) {
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

    // Check for duplicate BGMI IDs across players (only if BGMI IDs provided)
    const bgmiIds = players.map(p => p.bgmiId).filter(Boolean);
    if (bgmiIds.length > 0) {
      const existingPlayerBgmiId = await Team.findOne({ 'players.bgmiId': { $in: bgmiIds } });
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
      college: collegeName || 'In-House College Squad',
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

    // Send Instant Registration Confirmation Email to Captain
    if (captainEmail) {
      sendEmail({
        to: captainEmail,
        subject: `🎮 Squad Registration Received: ${teamName} (ID: ${registrationId})`,
        text: `Hello ${captainName},\n\nThank you for registering your squad "${teamName}" for the BGMI Esports Championship 2026!\n\nRegistration ID: ${registrationId}\nStatus: Under Verification\n\nOur tournament admins are currently reviewing your player roster and student proofs. Once verified, your status will update to APPROVED and you will receive custom room lobby details.\n\nBest of luck!`,
        html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0a0b0e; color: #f4f5f8; padding: 32px 20px; border-radius: 8px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.1);">
          <div style="text-align: center; padding-bottom: 20px; border-b: 1px solid rgba(255,255,255,0.1);">
            <h1 style="font-size: 22px; font-weight: 900; color: #ffffff; letter-spacing: 2px; margin: 0;">NIT BGMI ESPORTS CHAMPIONSHIP</h1>
            <p style="font-size: 11px; color: #e50914; font-weight: 700; letter-spacing: 3px; margin-top: 4px; text-transform: uppercase;">Official Registration Confirmation</p>
          </div>

          <div style="padding: 24px 0; space-y: 16px;">
            <p style="font-size: 15px; color: #e2e8f0; margin-bottom: 16px;">Hello <strong>${captainName}</strong>,</p>
            <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">
              Your squad <strong style="color: #ffffff;">"${teamName}"</strong> has successfully registered for the <strong>BGMI Esports Championship 2026</strong>.
            </p>

            <div style="background-color: #12141c; padding: 20px; border-radius: 6px; border-left: 4px solid #e50914; margin: 20px 0;">
              <p style="margin: 0; font-size: 10px; color: #c8aa6e; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">Registration Reference ID</p>
              <p style="margin: 6px 0 0 0; font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: 2px;">${registrationId}</p>
              <p style="margin: 6px 0 0 0; font-size: 11px; color: #94a3b8;">Status: <span style="color: #fbbf24; font-weight: bold;">● UNDER VERIFICATION</span></p>
            </div>

            <div style="background-color: #12141c; padding: 16px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 20px;">
              <h3 style="font-size: 12px; color: #c8aa6e; text-transform: uppercase; margin: 0 0 10px 0; letter-spacing: 1px;">Registered Squad Details</h3>
              <p style="font-size: 13px; color: #cbd5e1; margin: 4px 0;"><strong>College / Campus:</strong> ${collegeName || 'NIT Campus'}</p>
              <p style="font-size: 13px; color: #cbd5e1; margin: 4px 0;"><strong>Captain Phone:</strong> ${captainPhone}</p>
              <p style="font-size: 13px; color: #cbd5e1; margin: 4px 0;"><strong>Roster Players:</strong> ${players.length} Players Submitted</p>
            </div>

            <p style="font-size: 13px; color: #94a3b8; line-height: 1.5;">
              Our admin panel is currently reviewing your player student verification IDs. Once verified, you will receive an official Approval notification with Custom Room credentials.
            </p>
          </div>

          <div style="text-align: center; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 11px; color: #64748b;">
            <p style="margin: 0;">NIT BGMI Esports Committee • Tournament Operations</p>
            <p style="margin: 4px 0 0 0;">This is an automated message. Please keep your Registration ID secure.</p>
          </div>
        </div>
        `
      }).catch(err => console.error('Error sending registration confirmation email:', err));
    }

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

    // Send email notification to captain upon approval
    if (status === 'Approved' && team.captain && team.captain.email) {
      await sendEmail({
        to: team.captain.email,
        subject: `🎉 Squad Registration Approved — ${team.name} (${team.registrationId})`,
        text: `Hello ${team.captain.name},\n\nCongratulations! Your squad "${team.name}" (Registration ID: ${team.registrationId}) has been officially VERIFIED AND APPROVED by the tournament admin team for the BGMI Esports Championship 2026.\n\nPlease keep your Registration ID handy for custom room lobby entry.\n\nBest of luck!`,
        html: `<div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #ffffff; padding: 24px; border-radius: 12px; max-width: 600px;">
          <h2 style="color: #fbbf24; margin-bottom: 12px;">🎉 Squad Registration Approved!</h2>
          <p style="font-size: 14px; color: #cbd5e1;">Hello <strong>${team.captain.name}</strong>,</p>
          <p style="font-size: 14px; color: #cbd5e1;">Congratulations! Your squad <strong>"${team.name}"</strong> has been officially verified and approved for the <strong>BGMI Esports Championship 2026</strong>.</p>
          <div style="background-color: #1e293b; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #fbbf24;">
            <p style="margin: 0; font-size: 12px; color: #94a3b8; text-transform: uppercase;">Official Registration ID</p>
            <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: bold; color: #fbbf24; letter-spacing: 2px;">${team.registrationId}</p>
          </div>
          <p style="font-size: 13px; color: #94a3b8;">Please stay tuned to the match schedule for upcoming custom room lobby launch times.</p>
        </div>`
      });
    }

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
