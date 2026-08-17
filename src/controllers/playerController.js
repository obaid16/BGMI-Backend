const Team = require('../models/Team');
const logAction = require('../utils/auditLogger');

/**
 * @desc    Get all players across all approved/pending teams
 * @route   GET /api/players
 * @access  Public
 */
const getPlayers = async (req, res, next) => {
  try {
    const teams = await Team.find({});
    const playersList = [];

    teams.forEach(team => {
      if (team.players && Array.isArray(team.players)) {
        team.players.forEach(player => {
          // Serialize to JSON to include virtual id
          const playerJSON = player.toJSON();
          playersList.push({
            ...playerJSON,
            teamId: team._id.toString(),
            teamName: team.name,
            college: team.college,
            teamVerified: team.verified
          });
        });
      }
    });

    res.status(200).json({
      success: true,
      data: playersList
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get player by player ID
 * @route   GET /api/players/:id
 * @access  Public
 */
const getPlayerById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const team = await Team.findOne({ 'players._id': id });
    if (!team) {
      return res.status(404).json({ success: false, message: 'Player not found' });
    }

    const player = team.players.id(id);
    const playerJSON = player.toJSON();

    res.status(200).json({
      success: true,
      data: {
        ...playerJSON,
        teamId: team._id.toString(),
        teamName: team.name,
        college: team.college
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle or set verification status of a player
 * @route   PUT /api/players/:id/verify
 * @access  Private (Admin only)
 */
const verifyPlayer = async (req, res, next) => {
  const { id } = req.params;
  const { verified } = req.body; // boolean

  try {
    const team = await Team.findOne({ 'players._id': id });
    if (!team) {
      return res.status(404).json({ success: false, message: 'Player not found' });
    }

    const player = team.players.id(id);
    // Support verificationStatus string or verified boolean toggle
    if (req.body.verificationStatus !== undefined) {
      player.verificationStatus = req.body.verificationStatus;
      player.verified = req.body.verificationStatus === 'Verified';
    } else if (verified !== undefined) {
      player.verified = verified;
      player.verificationStatus = verified ? 'Verified' : 'Rejected';
    } else {
      player.verified = !player.verified;
      player.verificationStatus = player.verified ? 'Verified' : 'Rejected';
    }
    
    await team.save();

    await logAction(
      `Player Verification Status Updated`, 
      req.user, 
      `Player ${player.ign} (${player.name}) status = ${player.verificationStatus} verified = ${player.verified} under Team ${team.name}`, 
      player._id.toString(), 
      'Player'
    );

    res.status(200).json({
      success: true,
      message: `Player verification set to ${player.verified}`,
      data: player
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update player fields (name, ign, bgmiId, role, kills, kdRatio, etc.)
 * @route   PUT /api/players/:id
 * @access  Private (Admin only)
 */
const updatePlayer = async (req, res, next) => {
  const { id } = req.params;

  try {
    const team = await Team.findOne({ 'players._id': id });
    if (!team) {
      return res.status(404).json({ success: false, message: 'Player not found' });
    }

    const player = team.players.id(id);
    
    // Update fields
    const fieldsToUpdate = ['name', 'ign', 'bgmiId', 'role', 'avatar', 'kills', 'matchesPlayed', 'kdRatio', 'verified'];
    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) {
        player[field] = req.body[field];
      }
    });

    // Auto-calculate K/D ratio (Total Kills / Matches Played)
    const totalKills = Number(player.kills) || 0;
    const totalMatches = Number(player.matchesPlayed) || 1;
    player.kdRatio = parseFloat((totalKills / Math.max(1, totalMatches)).toFixed(2));

    await team.save();


    await logAction(
      'Player Profile Updated', 
      req.user, 
      `Player ${player.ign} profile details modified`, 
      player._id.toString(), 
      'Player'
    );

    res.status(200).json({
      success: true,
      message: 'Player updated successfully',
      data: player
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete/Remove player from roster
 * @route   DELETE /api/players/:id
 * @access  Private (Admin only)
 */
const deletePlayer = async (req, res, next) => {
  const { id } = req.params;

  try {
    const team = await Team.findOne({ 'players._id': id });
    if (!team) {
      return res.status(404).json({ success: false, message: 'Player not found' });
    }

    const player = team.players.id(id);
    const ign = player.ign;

    // Pull from subdocument list
    team.players.pull(id);
    await team.save();

    await logAction(
      'Player Removed from Team', 
      req.user, 
      `Player ${ign} deleted from roster of Team ${team.name}`, 
      id, 
      'Player'
    );

    res.status(200).json({
      success: true,
      message: 'Player removed from team successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get overall tournament MVP & fragger rankings
 * @route   GET /api/mvp
 * @access  Public
 */
const getMVP = async (req, res, next) => {
  try {
    const teams = await Team.find({ status: 'Approved' }).lean();
    const playersList = [];

    teams.forEach(team => {
      if (team.players && Array.isArray(team.players)) {
        team.players.forEach(player => {
          const pKills = Number(player.kills) || 0;
          const pMatches = Number(player.matchesPlayed) || 1;
          playersList.push({
            id: player._id ? player._id.toString() : player.id,
            name: player.name,
            ign: player.ign || player.name,
            teamId: team._id.toString(),
            teamName: team.name,
            teamShort: team.shortName,
            college: team.college,
            role: player.role || 'Assaulter',
            kills: pKills,
            matchesPlayed: pMatches,
            kdRatio: parseFloat((pKills / Math.max(1, pMatches)).toFixed(2)),
            verified: player.verified
          });
        });
      }
    });

    playersList.sort((a, b) => b.kills - a.kills);
    const topMvp = playersList[0] || null;

    res.status(200).json({
      success: true,
      data: {
        topMvp,
        players: playersList
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPlayers,
  getPlayerById,
  getMVP,
  verifyPlayer,
  updatePlayer,
  deletePlayer
};
