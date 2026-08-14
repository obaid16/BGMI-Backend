const Match = require('../models/Match');
const logAction = require('../utils/auditLogger');

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
      // capitalize or match exactly
      query.status = status;
    }
    if (round) {
      query.round = round;
    }

    // Sort: matchNumber ascending (1, 2, 3, 4)
    const matches = await Match.find(query).sort({ matchNumber: 1 });
    res.status(200).json({ success: true, data: matches });
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
      match = await Match.findOne({ matchNumber: matchNum });
    }
    if (!match && isObjectId) {
      match = await Match.findById(id);
    }
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }
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
  const { round, map, date, time, status, streamUrl, participatingTeams } = req.body;

  try {
    if (!round || !map || !date || !time) {
      return res.status(400).json({ success: false, message: 'Round, map, date, and time are required' });
    }

    const matchesCount = await Match.countDocuments({});
    const matchNumber = matchesCount + 1;
    const title = `Match #${matchNumber} - ${round} ${map}`;

    const match = await Match.create({
      matchNumber,
      title,
      round,
      map,
      date,
      time,
      status: status || 'Upcoming',
      streamUrl: streamUrl || 'https://youtube.com/live/example',
      teamsCount: participatingTeams ? participatingTeams.length : 16,
      participatingTeams: participatingTeams || []
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

    if (req.body.participatingTeams) {
      req.body.teamsCount = req.body.participatingTeams.length;
    }

    const updatedMatch = await Match.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

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

module.exports = {
  getMatches,
  getMatchById,
  createMatch,
  updateMatch,
  updateMatchStatus,
  deleteMatch
};
