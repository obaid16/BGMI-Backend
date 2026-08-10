const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    index: true
  },
  performedBy: {
    type: String,
    required: true
  },
  details: {
    type: String,
    default: ''
  },
  targetId: {
    type: String
  },
  targetType: {
    type: String,
    enum: ['Team', 'Player', 'Match', 'Result', 'Media', 'Announcement', 'Rule', 'Auth']
  }
}, {
  timestamps: true
});

AuditLogSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

AuditLogSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    return ret;
  }
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
