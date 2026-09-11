const Match = require('../models/Match');
const Team = require('../models/Team');
const logAction = require('../utils/auditLogger');
const { sendMatchLobbyEmail } = require('../services/emailService');

/**
 * @desc    Get list of matches (supports status filtering)
 * @route   GET /api/matches
 * @access  Public
 */
const getMatches = async (req, res, next) => {
  const { status, round } = req.query;

  try {
    const query = {};
    if (status) {
      query.status = status;
    }
    if (round) {
      query.round = round;
    }

    // Sort: matchNumber ascending (1, 2, 3, 4)
    const matches = await Match.find(query).sort({ matchNumber: 1 }).lean();

    // Fetch approved teams to enrich participating teams with logos
    const approvedTeams = await Team.find({ status: 'Approved' }).select('_id name shortName logo college').lean();
    const teamMap = new Map();
    approvedTeams.forEach((t) => {
      teamMap.set(t._id.toString(), t);
      teamMap.set(t.name.toLowerCase(), t);
    });

    const formatted = matches.map((m) => {
      let parts = m.participatingTeams || [];
      if (parts.length > 0) {
        parts = parts.map((pt) => {
          const found = teamMap.get(pt.id) || teamMap.get((pt.name || '').toLowerCase());
          return {
            id: pt.id || (found ? found._id.toString() : ''),
            name: pt.name || (found ? found.name : 'Team'),
            shortName: pt.shortName || (found ? found.shortName : 'TEAM'),
            logo: pt.logo || (found ? found.logo : ''),
          };
        });
      } else if (approvedTeams.length > 0) {
        // Auto-populate with real approved tournament squads if match doesn't have custom teams assigned
        parts = approvedTeams.map((t) => ({
          id: t._id.toString(),
          name: t.name,
          shortName: t.shortName || t.name.slice(0, 4).toUpperCase(),
          logo: t.logo || '',
        }));
      }

      return {
        ...m,
        id: m._id.toString(),
        participatingTeams: parts,
        teamsCount: parts.length > 0 ? parts.length : (m.teamsCount || 24),
      };
    });

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get match by ID
 * @route   GET /api/matches/:id
 * @access  Public
 */
const getMatchById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
    const matchNum = parseInt(id, 10);

    let match;
    if (!isNaN(matchNum)) {
      match = await Match.findOne({ matchNumber: matchNum }).lean();
    }
    if (!match && isObjectId) {
      match = await Match.findById(id).lean();
    }
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    // Enrich participating teams with logos
    const approvedTeams = await Team.find({ status: 'Approved' }).select('_id name shortName logo college').lean();
    const teamMap = new Map();
    approvedTeams.forEach((t) => {
      teamMap.set(t._id.toString(), t);
      teamMap.set(t.name.toLowerCase(), t);
    });

    let parts = match.participatingTeams || [];
    if (parts.length > 0) {
      parts = parts.map((pt) => {
        const found = teamMap.get(pt.id) || teamMap.get((pt.name || '').toLowerCase());
        return {
          id: pt.id || (found ? found._id.toString() : ''),
          name: pt.name || (found ? found.name : 'Team'),
          shortName: pt.shortName || (found ? found.shortName : 'TEAM'),
          logo: pt.logo || (found ? found.logo : ''),
        };
      });
    } else if (approvedTeams.length > 0) {
      parts = approvedTeams.map((t) => ({
        id: t._id.toString(),
        name: t.name,
        shortName: t.shortName || t.name.slice(0, 4).toUpperCase(),
        logo: t.logo || '',
      }));
    }

    match.id = match._id.toString();
    match.participatingTeams = parts;
    match.teamsCount = parts.length > 0 ? parts.length : (match.teamsCount || 24);

    res.status(200).json({ success: true, data: match });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a match schedule
 * @route   POST /api/matches
 * @access  Private (Admin only)
 */
const createMatch = async (req, res, next) => {
  const { round, map, date, time, status, streamUrl, participatingTeams, roomId, password } = req.body;

  try {
    if (!round || !map || !date || !time) {
      return res.status(400).json({ success: false, message: 'Round, map, date, and time are required' });
    }

    const matchesCount = await Match.countDocuments({});
    const matchNumber = matchesCount + 1;
    const title = `Match #${matchNumber} - ${round} ${map}`;

    // Normalize participatingTeams whether passed as string IDs or objects
    const formattedParticipatingTeams = [];
    if (Array.isArray(participatingTeams) && participatingTeams.length > 0) {
      for (const t of participatingTeams) {
        if (typeof t === 'string') {
          const teamDoc = await Team.findById(t).catch(() => null);
          if (teamDoc) {
            formattedParticipatingTeams.push({
              id: teamDoc._id.toString(),
              name: teamDoc.name,
              shortName: teamDoc.shortName || teamDoc.name.slice(0, 4).toUpperCase(),
              logo: teamDoc.logo || '',
            });
          } else {
            formattedParticipatingTeams.push({
              id: t,
              name: `Team ${t.slice(-4)}`,
              shortName: 'TEAM',
              logo: '',
            });
          }
        } else if (t && typeof t === 'object') {
          formattedParticipatingTeams.push({
            id: (t.id || t._id || '').toString(),
            name: t.name || 'Team',
            shortName: t.shortName || (t.name || 'TEAM').slice(0, 4).toUpperCase(),
            logo: t.logo || '',
          });
        }
      }
    }

    // Auto-populate from approved teams if not explicitly specified
    if (formattedParticipatingTeams.length === 0) {
      const approvedTeams = await Team.find({ status: 'Approved' }).lean();
      approvedTeams.forEach((t) => {
        formattedParticipatingTeams.push({
          id: t._id.toString(),
          name: t.name,
          shortName: t.shortName || t.name.slice(0, 4).toUpperCase(),
          logo: t.logo || '',
        });
      });
    }

    const match = await Match.create({
      matchNumber,
      title,
      round,
      map,
      date,
      time,
      status: status || 'Upcoming',
      roomId: roomId || '',
      password: password || '',
      streamUrl: streamUrl || 'https://youtube.com/live/example',
      teamsCount: formattedParticipatingTeams.length > 0 ? formattedParticipatingTeams.length : 16,
      participatingTeams: formattedParticipatingTeams
    });

    await logAction('Match Created', req.user, `Match #${matchNumber} scheduled for ${date} at ${time}`, match._id.toString(), 'Match');

    res.status(201).json({ success: true, data: match });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update match schedule or participating teams
 * @route   PUT /api/matches/:id
 * @access  Private (Admin only)
 */
const updateMatch = async (req, res, next) => {
  const { id } = req.params;

  try {
    const match = await Match.findById(id);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    // If update round/map, update title too
    if (req.body.round || req.body.map) {
      const round = req.body.round || match.round;
      const map = req.body.map || match.map;
      req.body.title = `Match #${match.matchNumber} - ${round} ${map}`;
    }

    if (req.body.participatingTeams && Array.isArray(req.body.participatingTeams)) {
      const formatted = [];
      for (const t of req.body.participatingTeams) {
        if (typeof t === 'string') {
          const teamDoc = await Team.findById(t).catch(() => null);
          if (teamDoc) {
            formatted.push({
              id: teamDoc._id.toString(),
              name: teamDoc.name,
              shortName: teamDoc.shortName || teamDoc.name.slice(0, 4).toUpperCase()
            });
          } else {
            formatted.push({
              id: t,
              name: `Team ${t.slice(-4)}`,
              shortName: 'TEAM'
            });
          }
        } else if (t && typeof t === 'object') {
          formatted.push({
            id: (t.id || t._id || '').toString(),
            name: t.name || 'Team',
            shortName: t.shortName || (t.name || 'TEAM').slice(0, 4).toUpperCase()
          });
        }
      }
      req.body.participatingTeams = formatted;
      req.body.teamsCount = formatted.length;
    }

    const updatedMatch = await Match.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

    // Optional: Dispatch match lobby credentials if room ID & password provided
    if (req.body.roomId && req.body.password && updatedMatch.participatingTeams && Array.isArray(updatedMatch.participatingTeams)) {
      updatedMatch.participatingTeams.forEach((t, idx) => {
        if (t.captainEmail) {
          sendMatchLobbyEmail({
            to: t.captainEmail,
            captainName: t.captainName || 'Team Captain',
            teamName: t.name || 'Participating Squad',
            matchTitle: updatedMatch.title,
            roomId: req.body.roomId,
            password: req.body.password,
            time: updatedMatch.time,
            slotNumber: idx + 1
          }).catch(err => console.error('[EMAIL] Lobby credential mail error:', err.message));
        }
      });
    }

    await logAction('Match Updated', req.user, `Match schedule modified for ${updatedMatch.title}`, id, 'Match');

    res.status(200).json({ success: true, data: updatedMatch });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update match status (Live, Completed, Cancelled)
 * @route   PUT /api/matches/:id/status
 * @access  Private (Admin only)
 */
const updateMatchStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const match = await Match.findById(id);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    match.status = status;
    await match.save();

    await logAction(`Match Status Updated to ${status}`, req.user, `Match #${match.matchNumber} set to ${status}`, id, 'Match');

    res.status(200).json({ success: true, message: `Match status set to ${status}`, data: match });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete match schedule
 * @route   DELETE /api/matches/:id
 * @access  Private (Admin only)
 */
const deleteMatch = async (req, res, next) => {
  const { id } = req.params;

  try {
    const match = await Match.findByIdAndDelete(id);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    await logAction('Match Deleted', req.user, `Match #${match.matchNumber} deleted`, id, 'Match');

    res.status(200).json({ success: true, message: 'Match deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk delete matches
 * @route   POST /api/matches/bulk-delete
 * @access  Private (Admin only)
 */
const bulkDeleteMatches = async (req, res, next) => {
  const { ids } = req.body;

  try {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of match IDs to delete' });
    }

    const result = await Match.deleteMany({ _id: { $in: ids } });

    await logAction('Bulk Matches Deleted', req.user, `Bulk deleted ${result.deletedCount} matches`, '', 'Match');

    res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} match(es)`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMatches,
  getMatchById,
  createMatch,
  updateMatch,
  updateMatchStatus,
  deleteMatch,
  bulkDeleteMatches
};
