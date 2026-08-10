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
        { rank: 1, points: SCORING_CONFIG.placementPointsMap[1] },
        { rank: 2, points: SCORING_CONFIG.placementPointsMap[2] },
        { rank: 3, points: SCORING_CONFIG.placementPointsMap[3] },
        { rank: 4, points: SCORING_CONFIG.placementPointsMap[4] },
        { rank: 5, points: SCORING_CONFIG.placementPointsMap[5] },
        { rank: 6, points: SCORING_CONFIG.placementPointsMap[6] },
        { rank: 7, points: SCORING_CONFIG.placementPointsMap[7] },
        { rank: 8, points: SCORING_CONFIG.placementPointsMap[8] },
        { rank: '9-16', points: 0 }
      ],
      killPointMultiplier: SCORING_CONFIG.killPointMultiplier,
      bonusRules: '1 Bonus Point for WWCD + 15 Placement Points',
      penaltyRules: '-5 Points for non-compliance with recording / disconnect delay'
    }
  });
};

module.exports = {
  getLeaderboard,
  getScoringConfig
};
