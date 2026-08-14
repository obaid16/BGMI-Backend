/**
 * Tournament Scoring Configuration
 * Easily modifiable based on collegiate rules
 */
const SCORING_CONFIG = {
  placementPointsMap: {
    1: 10,
    2: 8,
    3: 5
  },
  killPointMultiplier: 1,
  defaultBonusWWCD: 0 // Optional WWCD extra bonus if specified
};

/**
 * Calculates placement, kill, and total points for a scorecard entry
 * @param {object} params - { placementRank, kills, bonus, penalty }
 * @returns {object} - { placementPoints, killPoints, bonus, penalty, totalPoints }
 */
function calculatePoints({ placementRank, kills = 0, bonus = 0, penalty = 0 }) {
  const rank = parseInt(placementRank, 10);
  const killCount = parseInt(kills, 10) || 0;
  const bonusPts = parseInt(bonus, 10) || 0;
  const penaltyPts = parseInt(penalty, 10) || 0;

  const placementPoints = SCORING_CONFIG.placementPointsMap[rank] || 0;
  const killPoints = killCount * SCORING_CONFIG.killPointMultiplier;
  const totalPoints = placementPoints + killPoints + bonusPts - penaltyPts;

  return {
    placementPoints,
    killPoints,
    bonus: bonusPts,
    penalty: penaltyPts,
    totalPoints
  };
}

module.exports = {
  SCORING_CONFIG,
  calculatePoints
};
