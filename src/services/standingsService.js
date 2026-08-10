const Team = require('../models/Team');
const MatchResult = require('../models/MatchResult');

/**
 * Calculates current standings by aggregating match results for all approved teams
 * @returns {Promise<Array>} - List of ranked team standings
 */
async function calculateStandings() {
  // Fetch all approved teams
  const teams = await Team.find({ status: 'Approved' }).lean();
  
  // Fetch all published match results
  const results = await MatchResult.find({ 
    $or: [{ published: true }, { publish: true }] 
  }).lean();

  // Initialize standings map for fast lookup
  const standingsMap = {};
  teams.forEach(team => {
    standingsMap[team._id.toString()] = {
      teamId: team._id.toString(),
      teamName: team.name,
      college: team.college,
      logo: team.logo,
      matches: 0,
      wwcd: 0,
      placementPoints: 0,
      kills: 0,
      killPoints: 0,
      penalty: 0,
      totalPoints: 0
    };
  });

  // Aggregate stats from match results
  results.forEach(result => {
    if (!result.leaderboard || !Array.isArray(result.leaderboard)) return;

    result.leaderboard.forEach(entry => {
      // Look up team by ID (if saved as teamId object/string) or fallback by name matching
      let teamId = entry.teamId ? entry.teamId.toString() : null;
      
      if (!teamId) {
        // Fallback: match by team name
        const matchedTeam = teams.find(t => t.name.toLowerCase() === entry.team.toLowerCase());
        if (matchedTeam) {
          teamId = matchedTeam._id.toString();
        }
      }

      if (teamId && standingsMap[teamId]) {
        const teamStats = standingsMap[teamId];
        teamStats.matches += 1;
        teamStats.placementPoints += (entry.placementPts || entry.placementPoints || 0);
        teamStats.kills += (entry.kills || 0);
        teamStats.killPoints += (entry.killPts || entry.killPoints || entry.kills || 0);
        
        const entryPenalty = entry.penalty || 0;
        teamStats.penalty += entryPenalty;
        
        // Sum total points
        teamStats.totalPoints += (entry.total || entry.totalPoints || 0);

        // WWCD count if placement rank was 1
        if (parseInt(entry.rank || entry.placementRank, 10) === 1) {
          teamStats.wwcd += 1;
        }
      }
    });
  });

  // Convert map to array
  const standingsList = Object.values(standingsMap);

  // Sort standings: Total Points desc, Kills desc, Placement Points desc, WWCD desc
  standingsList.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }
    if (b.kills !== a.kills) {
      return b.kills - a.kills;
    }
    if (b.placementPoints !== a.placementPoints) {
      return b.placementPoints - a.placementPoints;
    }
    return b.wwcd - a.wwcd;
  });

  // Assign ranks
  standingsList.forEach((stat, index) => {
    stat.rank = index + 1;
  });

  return standingsList;
}

module.exports = {
  calculateStandings
};
