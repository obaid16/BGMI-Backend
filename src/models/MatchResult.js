const mongoose = require('mongoose');

const LeaderboardEntrySchema = new mongoose.Schema({
  rank: {
    type: Number,
    required: true
  },
  team: {
    type: String,
    required: true
  },
  teamId: {
    type: String,
    required: true
  },
  placementPts: {
    type: Number,
    required: true
  },
  kills: {
    type: Number,
    required: true
  },
  killPts: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  bonus: {
    type: Number,
    default: 0
  },
  penalty: {
    type: Number,
    default: 0
  }
});

const MatchResultSchema = new mongoose.Schema({
  matchId: {
    type: String,
    required: true,
    index: true
  },
  matchNumber: {
    type: Number,
    required: true
  },
  round: {
    type: String,
    required: true
  },
  map: {
    type: String,
    required: true
  },
  date: {
    type: String,
    default: () => new Date().toISOString().split('T')[0]
  },
  winner: {
    teamId: { type: String },
    teamName: { type: String, required: true },
    logo: { type: String },
    kills: { type: Number, required: true },
    placementPoints: { type: Number, required: true },
    totalPoints: { type: Number, required: true }
  },
  mvp: {
    name: { type: String },
    team: { type: String },
    kills: { type: Number },
    damage: { type: Number },
    avatar: { type: String }
  },
  leaderboard: [LeaderboardEntrySchema],
  proofs: {
    screenshots: [{ type: String }],
    povVideos: [{
      title: { type: String },
      url: { type: String }
    }]
  },
  published: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

MatchResultSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

MatchResultSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    if (ret.leaderboard) {
      ret.leaderboard.forEach(entry => {
        entry.id = entry._id.toString();
      });
    }
    return ret;
  }
});

module.exports = mongoose.model('MatchResult', MatchResultSchema);
