const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
  matchNumber: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  round: {
    type: String,
    required: true,
    trim: true
  },
  map: {
    type: String,
    required: true,
    enum: ['Erangel', 'Livik'],
    default: 'Erangel'
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Upcoming', 'Live', 'Completed', 'Cancelled'],
    default: 'Upcoming'
  },
  streamUrl: {
    type: String,
    default: 'https://youtube.com/live/example'
  },
  teamsCount: {
    type: Number,
    default: 16
  },
  participatingTeams: [{
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    shortName: {
      type: String,
      required: true
    }
  }],
  winner: {
    id: { type: String },
    name: { type: String },
    shortName: { type: String },
    kills: { type: Number },
    points: { type: Number }
  },
  topFragger: {
    name: { type: String },
    team: { type: String },
    kills: { type: Number }
  }
}, {
  timestamps: true
});

MatchSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

MatchSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    return ret;
  }
});

module.exports = mongoose.model('Match', MatchSchema);
