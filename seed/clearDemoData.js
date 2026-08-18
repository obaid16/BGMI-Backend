require('dotenv').config();
const mongoose = require('mongoose');

// Import Mongoose Models
const User = require('../src/models/User');
const Team = require('../src/models/Team');
const Match = require('../src/models/Match');
const MatchResult = require('../src/models/MatchResult');
const Media = require('../src/models/Media');
const Announcement = require('../src/models/Announcement');
const Rule = require('../src/models/Rule');
const AuditLog = require('../src/models/AuditLog');

const dbUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bgmi_esports';

const clearDatabase = async () => {
  try {
    console.log('Connecting to database for clearing demo data...');
    await mongoose.connect(dbUri);
    console.log('Connected to MongoDB.');

    console.log('Clearing all demo data collections (Teams, Matches, Scorecards, Media, Bulletins)...');
    await Team.deleteMany({});
    await Match.deleteMany({});
    await MatchResult.deleteMany({});
    await Media.deleteMany({});
    await Announcement.deleteMany({});
    await AuditLog.deleteMany({});

    console.log('Demo data wiped successfully!');
    console.log('Database is now clean for fresh production entries.');
    process.exit(0);
  } catch (error) {
    console.error('Clearing database failed:', error.message);
    process.exit(1);
  }
};

clearDatabase();
