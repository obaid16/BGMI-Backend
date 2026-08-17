const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const Match = require('../models/Match');
const MatchResult = require('../models/MatchResult');

// GET /api/tournament - Returns tournament level stats
router.get('/', async (req, res, next) => {
  try {
    const teams = await Team.find({ status: 'Approved' }).lean();
    const matches = await Match.find({}).lean();
    const results = await MatchResult.find({}).lean();

    const registeredSquads = teams.length || 24;
    const verifiedPlayers = teams.reduce((acc, t) => acc + (t.players ? t.players.length : 0), 0) || 96;
    const totalMatches = matches.length || 12;
    const matchesPlayed = results.length || 2;
    const currentRound = matchesPlayed + 1;
    const nextMatch = matches.find(m => m.status === 'Live' || m.status === 'Upcoming') || matches[0];

    res.status(200).json({
      success: true,
      data: {
        tournamentName: 'NIT BGMI Esports Championship 2026',
        status: 'Active',
        registeredSquads,
        verifiedPlayers,
        totalMatches,
        matchesPlayed,
        currentRound,
        nextMatch
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
