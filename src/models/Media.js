const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['POV', 'Screenshots', 'Team Photos', 'Player Photos', 'Results'],
    default: 'POV'
  },
  team: {
    type: String,
    required: true,
    trim: true
  },
  teamId: {
    type: String
  },
  player: {
    type: String,
    required: true,
    trim: true
  },
  match: {
    type: String,
    required: true,
    trim: true
  },
  matchId: {
    type: String
  },
  thumbnail: {
    type: String,
    default: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80'
  },
  videoUrl: {
    type: String
  },
  imageUrl: {
    type: String
  },
  verified: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['Pending Review', 'Verified', 'Published', 'Approved', 'Rejected'],
    default: 'Pending Review'
  },
  date: {
    type: String,
    default: () => new Date().toISOString().split('T')[0]
  }
}, {
  timestamps: true
});

MediaSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

MediaSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    return ret;
  }
});

module.exports = mongoose.model('Media', MediaSchema);
