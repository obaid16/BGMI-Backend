require('dotenv').config();
const mongoose = require('mongoose');
const Match = require('./src/models/Match');
const MatchResult = require('./src/models/MatchResult');

async function deleteAllMatches() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGO_URI is missing!');
      process.exit(1);
    }
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas');

    const matchesDeleted = await Match.deleteMany({});
    console.log(`Deleted ${matchesDeleted.deletedCount} matches from Match collection`);

    const resultsDeleted = await MatchResult.deleteMany({});
    console.log(`Deleted ${resultsDeleted.deletedCount} results from MatchResult collection`);

    await mongoose.disconnect();
    console.log('Finished match data cleanup!');
    process.exit(0);
  } catch (err) {
    console.error('Error during match deletion:', err);
    process.exit(1);
  }
}

deleteAllMatches();
