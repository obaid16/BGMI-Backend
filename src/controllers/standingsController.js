const { calculateStandings } = require('../services/standingsService');
const { SCORING_CONFIG } = require('../services/pointsService');

/**
 * @desc    Get dynamic leaderboard standings
 * @route   GET /api/standings
 * @access  Public
 */
const getLeaderboard = async (req, res, next) => {
  try {
    const standings = await calculateStandings();
    res.status(200).json({ success: true, data: standings });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get scoring point distribution rules config
 * @route   GET /api/standings/rules
 * @access  Public
 */
const getScoringConfig = (req, res) => {
  // Matches structure of frontend's scoringRules in standings.js
  res.status(200).json({
    success: true,
    data: {
      placementPoints: [
        { rank: 1, points: SCORING_CONFIG.placementPointsMap[1] || 10 },
        { rank: 2, points: SCORING_CONFIG.placementPointsMap[2] || 8 },
        { rank: 3, points: SCORING_CONFIG.placementPointsMap[3] || 5 },
        { rank: '4+', points: 0 }
      ],
      killPointMultiplier: SCORING_CONFIG.killPointMultiplier,
      bonusRules: '10 Placement Points for WWCD + 1 Point per Kill',
      penaltyRules: '-5 Points for non-compliance with recording / disconnect delay'
    }
  });
};

module.exports = {
  getLeaderboard,
  getScoringConfig
};
