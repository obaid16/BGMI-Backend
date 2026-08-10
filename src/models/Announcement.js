const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['General', 'Registration', 'Schedule', 'Results', 'Rules'],
    default: 'General'
  },
  date: {
    type: String,
    default: () => new Date().toISOString().split('T')[0]
  },
  priority: {
    type: String,
    enum: ['Urgent', 'High', 'Normal', 'Low'],
    default: 'Normal'
  },
  published: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

AnnouncementSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

AnnouncementSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    return ret;
  }
});

module.exports = mongoose.model('Announcement', AnnouncementSchema);
