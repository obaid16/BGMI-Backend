const mongoose = require('mongoose');
const MatchResult = require('../models/MatchResult');
const Match = require('../models/Match');
const Team = require('../models/Team');
const { calculatePoints } = require('../services/pointsService');
const logAction = require('../utils/auditLogger');

/**
 * @desc    Get all published match results
 * @route   GET /api/results
 * @access  Public
 */
const getResults = async (req, res, next) => {
  try {
    const results = await MatchResult.find({ 
      $or: [{ published: true }, { publish: true }] 
    }).sort({ matchNumber: -1 });
    
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get result by matchId or result ID
 * @route   GET /api/results/:id
 * @access  Public
 */
const getResultById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
    const matchNum = parseInt(id, 10);
    const queryOr = [];

    if (!isNaN(matchNum)) {
      queryOr.push({ matchNumber: matchNum });
    }
    if (isObjectId) {
      queryOr.push({ _id: id });
      queryOr.push({ matchId: id });
    }
    queryOr.push({ matchId: id });

    const result = await MatchResult.findOne({ $or: queryOr });
    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit a match result (calculates points on backend, updates match to Completed)
 * @route   POST /api/results
 * @access  Private (Admin only)
 */
const submitResult = async (req, res, next) => {
  const { matchId, leaderboard, proofs, winnerTeamId, mvp } = req.body;

  try {
    if (!matchId || !leaderboard || !Array.isArray(leaderboard) || leaderboard.length === 0) {
      return res.status(400).json({ success: false, message: 'MatchId and leaderboard array are required' });
    }

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Target Match not found' });
    }

    // Check if result already exists for this match
    let matchResult = await MatchResult.findOne({ matchId: match._id.toString() });
    
    // Process and calculate points for each leaderboard entry
    const processedLeaderboard = [];
    let winnerEntry = null;

    for (const entry of leaderboard) {
      const team = await Team.findById(entry.teamId || entry.team);
      if (!team) continue;

      const pointsCalc = calculatePoints({
        placementRank: entry.rank,
        kills: entry.kills,
        bonus: entry.bonus || 0,
        penalty: entry.penalty || 0
      });

      const processedEntry = {
        rank: parseInt(entry.rank, 10),
        team: team.name,
        teamId: team._id.toString(),
        placementPts: pointsCalc.placementPoints,
        kills: pointsCalc.killPoints,
        killPts: pointsCalc.killPoints,
        bonus: pointsCalc.bonus,
        penalty: pointsCalc.penalty,
        total: pointsCalc.totalPoints
      };

      processedLeaderboard.push(processedEntry);

      if (processedEntry.rank === 1) {
        winnerEntry = {
          teamId: team._id.toString(),
          teamName: team.name,
          logo: team.logo,
          kills: processedEntry.kills,
          placementPoints: processedEntry.placementPts,
          totalPoints: processedEntry.total
        };
      }
    }

    // Sort processed leaderboard by rank
    processedLeaderboard.sort((a, b) => a.rank - b.rank);

    // If no rank 1 was found, default to first item
    if (!winnerEntry && processedLeaderboard.length > 0) {
      const top = processedLeaderboard[0];
      winnerEntry = {
        teamId: top.teamId,
        teamName: top.team,
        kills: top.kills,
        placementPoints: top.placementPts,
        totalPoints: top.total
      };
    }

    // Identify MVP from req.body or winner team
    let mvpData = null;
    if (mvp && (mvp.name || mvp.ign)) {
      mvpData = {
        name: mvp.name || mvp.ign,
        ign: mvp.ign || mvp.name,
        team: mvp.team || winnerEntry?.teamName || 'Unknown Team',
        kills: parseInt(mvp.kills, 10) || 0,
        damage: (parseInt(mvp.kills, 10) || 0) * 150,
        avatar: mvp.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
      };
    } else if (winnerEntry && winnerEntry.teamId) {
      const winTeam = await Team.findById(winnerEntry.teamId);
      if (winTeam && winTeam.players && winTeam.players.length > 0) {
        const keyPlayer = winTeam.players.find(p => p.role === 'Assaulter') || winTeam.players[0];
        mvpData = {
          name: keyPlayer.name,
          ign: keyPlayer.ign || keyPlayer.name,
          team: winTeam.name,
          kills: Math.max(winnerEntry.kills - 2, 3),
          damage: Math.max((winnerEntry.kills - 2) * 150, 450),
          avatar: keyPlayer.avatar
        };
      }
    }

    if (!mvpData) {
      mvpData = {
        name: 'MVP Player',
        ign: 'MVP',
        team: winnerEntry?.teamName || 'Team',
        kills: winnerEntry?.kills || 0,
        damage: (winnerEntry?.kills || 0) * 150
      };
    }

    if (matchResult) {
      // Update existing
      matchResult.leaderboard = processedLeaderboard;
      matchResult.winner = winnerEntry;
      matchResult.mvp = mvpData;
      if (proofs) matchResult.proofs = proofs;
      await matchResult.save();
    } else {
      // Create new
      matchResult = await MatchResult.create({
        matchId: match._id.toString(),
        matchNumber: match.matchNumber,
        round: match.round,
        map: match.map,
        winner: winnerEntry,
        mvp: mvpData,
        leaderboard: processedLeaderboard,
        proofs: proofs || { screenshots: [], povVideos: [] },
        published: true
      });
    }

    // Update match status to Completed and store winner & top fragger details
    match.status = 'Completed';
    match.winner = {
      id: winnerEntry.teamId,
      name: winnerEntry.teamName,
      shortName: winnerEntry.teamName.substring(0, 5).toUpperCase(),
      kills: winnerEntry.kills,
      points: winnerEntry.totalPoints
    };
    match.topFragger = {
      name: mvpData.name,
      team: mvpData.team,
      kills: mvpData.kills
    };
    await match.save();

    // Recalculate team stats for all teams in collection to keep standings accurate
    const allTeams = await Team.find();
    for (const team of allTeams) {
      const teamIdStr = team._id.toString();
      const teamResults = await MatchResult.find({
        $or: [
          { 'leaderboard.teamId': teamIdStr },
          { 'leaderboard.team': team.name }
        ]
      });

      let totalPoints = 0;
      let totalKills = 0;
      let totalWWCD = 0;
      let matchesPlayed = 0;

      teamResults.forEach(tr => {
        const entry = tr.leaderboard.find(e => e.teamId === teamIdStr || e.team === team.name);
        if (entry) {
          totalPoints += (entry.total !== undefined ? entry.total : entry.totalPoints || 0);
          totalKills += (entry.kills !== undefined ? entry.kills : entry.killPts || 0);
          matchesPlayed += 1;
          if (entry.rank === 1) {
            totalWWCD += 1;
          }
        }
      });

      team.points = totalPoints;
      team.kills = totalKills;
      team.wwcd = totalWWCD;
      team.matchesPlayed = matchesPlayed;
      
      // Split kills among team players dynamically for realism
      if (team.players && team.players.length > 0) {
        const playersCount = team.players.length;
        const avgKillsPerPlayer = Math.floor(totalKills / playersCount);
        team.players.forEach((p, idx) => {
          p.kills = avgKillsPerPlayer + (idx === 0 ? totalKills % playersCount : 0);
          p.kdRatio = matchesPlayed > 0 ? parseFloat((p.kills / matchesPlayed).toFixed(2)) : 0;
        });
      }

      await team.save();
    }

    // Sort and update ranks for all teams
    const sortedTeams = await Team.find().sort({ points: -1, wwcd: -1, kills: -1 });
    for (let i = 0; i < sortedTeams.length; i++) {
      sortedTeams[i].rank = i + 1;
      await sortedTeams[i].save();
    }

    await logAction('Result Entry Published', req.user, `Results entered for match #${match.matchNumber}`, matchResult._id.toString(), 'Result');

    res.status(201).json({ success: true, data: matchResult });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a match result
 * @route   DELETE /api/results/:id
 * @access  Private (Admin only)
 */
const deleteResult = async (req, res, next) => {
  const { id } = req.params;

  try {
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    let result = null;

    if (isObjectId) {
      result = await MatchResult.findByIdAndDelete(id);
    }
    if (!result) {
      result = await MatchResult.findOneAndDelete({
        $or: [
          { matchId: id },
          { _id: isObjectId ? id : null },
          { matchNumber: Number(id) || -1 }
        ]
      });
    }

    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }

    // Set match back to upcoming
    const match = await Match.findOne({
      $or: [
        { _id: isObjectId ? (result.matchId || id) : null },
        { matchNumber: result.matchNumber }
      ]
    });

    if (match) {
      match.status = 'Upcoming';
      match.winner = undefined;
      match.topFragger = undefined;
      await match.save();
    }

    // Recalculate team overall points & standings
    const allTeams = await Team.find();
    for (const team of allTeams) {
      const teamIdStr = team._id.toString();
      const teamResults = await MatchResult.find({
        $or: [
          { 'leaderboard.teamId': teamIdStr },
          { 'leaderboard.team': team.name }
        ]
      });

      let totalPoints = 0;
      let totalKills = 0;
      let totalWWCD = 0;
      let matchesPlayed = 0;

      teamResults.forEach(tr => {
        const entry = tr.leaderboard.find(e => e.teamId === teamIdStr || e.team === team.name);
        if (entry) {
          totalPoints += (entry.total !== undefined ? entry.total : entry.totalPoints || 0);
          totalKills += (entry.kills !== undefined ? entry.kills : entry.killPts || 0);
          matchesPlayed += 1;
          if (entry.rank === 1) {
            totalWWCD += 1;
          }
        }
      });

      team.points = totalPoints;
      team.kills = totalKills;
      team.wwcd = totalWWCD;
      team.matchesPlayed = matchesPlayed;

      if (team.players && team.players.length > 0) {
        const playersCount = team.players.length;
        const avgKillsPerPlayer = Math.floor(totalKills / playersCount);
        team.players.forEach((p, idx) => {
          p.kills = avgKillsPerPlayer + (idx === 0 ? totalKills % playersCount : 0);
          p.kdRatio = matchesPlayed > 0 ? parseFloat((p.kills / matchesPlayed).toFixed(2)) : 0;
        });
      }

      await team.save();
    }

    await logAction('Result Deleted', req.user, `Result deleted for match #${result.matchNumber}`, id, 'Result');

    res.status(200).json({ success: true, message: 'Result deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getResults,
  getResultById,
  submitResult,
  deleteResult
};
