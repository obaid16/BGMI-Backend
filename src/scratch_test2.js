require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Team = require('./models/Team');
const jwt = require('jsonwebtoken');
const { sendRegistrationApproval } = require('./services/emailService');

async function runApprovalTest() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const team = await Team.findOne({}).sort({ createdAt: -1 });
  if (!team) {
    console.log('No team found in DB');
    process.exit(1);
  }

  console.log(`Found Team: ${team.name} (${team.registrationId})`);
  const captainEmail = (team.captain && team.captain.email) || team.captainEmail || 'khanakib4212@gmail.com';
  const captainName = (team.captain && team.captain.name) || team.captainName || 'Captain';

  console.log(`Sending Approval Email via sendRegistrationApproval to ${captainEmail}...`);
  const res = await sendRegistrationApproval({
    to: captainEmail,
    captainName,
    teamName: team.name,
    registrationId: team.registrationId
  });

  console.log('APPROVAL EMAIL RESULT:', res);
  process.exit(0);
}

runApprovalTest();
