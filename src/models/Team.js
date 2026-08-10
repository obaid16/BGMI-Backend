const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  ign: {
    type: String,
    required: true,
    trim: true
  },
  bgmiId: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    enum: ['IGL', 'Assaulter', 'Support', 'Sniper', 'Entry Fragger', 'Substitute'],
    default: 'Support'
  },
  verified: {
    type: Boolean,
    default: false
  },
  avatar: {
    type: String,
    default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
  },
  studentProof: {
    type: String,
    default: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'
  },
  verificationStatus: {
    type: String,
    enum: ['Pending Verification', 'Verified', 'Rejected'],
    default: 'Pending Verification'
  },
  kills: {
    type: Number,
    default: 0
  },
  kdRatio: {
    type: Number,
    default: 0.0
  }
});

const TeamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  shortName: {
    type: String,
    required: true,
    trim: true
  },
  college: {
    type: String,
    required: true,
    trim: true
  },
  logo: {
    type: String,
    default: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&auto=format&fit=crop&q=80'
  },
  banner: {
    type: String,
    default: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80'
  },
  rank: {
    type: Number,
    default: 0
  },
  points: {
    type: Number,
    default: 0
  },
  wwcd: {
    type: Number,
    default: 0
  },
  kills: {
    type: Number,
    default: 0
  },
  matchesPlayed: {
    type: Number,
    default: 0
  },
  verified: {
    type: Boolean,
    default: false
  },
  captain: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    }
  },
  registrationId: {
    type: String,
    unique: true
  },
  registrationDate: {
    type: String,
    default: () => new Date().toISOString().split('T')[0]
  },
  status: {
    type: String,
    enum: ['Pending', 'Under Review', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  players: [PlayerSchema]
}, {
  timestamps: true
});

// virtual to make _id look like id to match frontend
TeamSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Ensure virtuals are serialized
TeamSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    if (ret.players) {
      ret.players.forEach(p => {
        p.id = p._id.toString();
      });
    }
    return ret;
  }
});

module.exports = mongoose.model('Team', TeamSchema);
