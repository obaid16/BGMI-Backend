require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import Mongoose Models
const User = require('../src/models/User');
const Team = require('../src/models/Team');
const Match = require('../src/models/Match');
const MatchResult = require('../src/models/MatchResult');
const Media = require('../src/models/Media');
const Announcement = require('../src/models/Announcement');
const Rule = require('../src/models/Rule');
const AuditLog = require('../src/models/AuditLog');

// Connect to Database
const dbUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bgmi_esports';

const seedDatabase = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(dbUri);
    console.log('Connected to MongoDB.');

    // Clear existing collections
    console.log('Clearing existing database collections...');
    await User.deleteMany({});
    await Team.deleteMany({});
    await Match.deleteMany({});
    await MatchResult.deleteMany({});
    await Media.deleteMany({});
    await Announcement.deleteMany({});
    await Rule.deleteMany({});
    await AuditLog.deleteMany({});
    console.log('Collections cleared.');

    // 1. SEED DEFAULT SUPER ADMIN
    console.log('Seeding default administrator...');
    const adminUser = await User.create({
      name: 'Tournament Director',
      email: 'admin@bgmi-esports.in',
      password: 'admin123', // Will be hashed by pre-save middleware
      role: 'SUPER_ADMIN'
    });
    console.log('Admin user seeded (admin@bgmi-esports.in / admin123).');

    // 2. SEED HANDBOOK RULES (In-house Championship Rules)
    console.log('Seeding rules handbook...');
    const rules = [
      {
        category: 'Eligibility',
        title: '1. Roster Eligibility & Enrollment',
        content: 'Only current students of [COLLEGE NAME] are allowed to participate in this tournament. External players, guest teams, and students from other universities are strictly prohibited. All participants must hold a valid college roll number and active student status.',
        order: 1
      },
      {
        category: 'Student Verification',
        title: '2. Student ID Verification',
        content: 'Every player must provide valid college student identification (physical ID card scan or digital student proof portal snapshot) during registration. Roster verification status must show COLLEGE VERIFIED on player profiles before lobby matches start. Players with pending or rejected verification status will be disqualified.',
        order: 2
      },
      {
        category: 'Team Format',
        title: '3. Team Composition & Roster',
        content: 'Squad rosters must consist of exactly 4 Main Players and up to 1 optional substitute player. All players must be registered under the same college squad name. No player may play for more than one team in the tournament.',
        order: 3
      },
      {
        category: 'Match Rules',
        title: '4. Lobby slotting & Custom Rooms',
        content: 'Custom room credentials (ID & password) will be shared in the captains group 15 minutes before the scheduled start time. Teams must sit strictly in their assigned lobby slot numbers. Lobby grace period is exactly 3 minutes, after which the game launches.',
        order: 4
      },
      {
        category: 'Scoring System',
        title: '5. Placement & Kill Points Formula',
        content: 'Leaderboard points are computed per match as follows:\n- 1st Place (WWCD): 15 Points\n- 2nd Place: 12 Points\n- 3rd Place: 10 Points\n- 4th Place: 8 Points\n- 5th Place: 6 Points\n- 6th Place: 4 Points\n- 7th Place: 2 Points\n- 8th Place: 1 Point\n- 9th - 16th Place: 0 Points\n- Finish / Kill Points: 1 Point per kill.',
        order: 5
      },
      {
        category: 'POV Requirements',
        title: '6. Mandatory POV Screen Recording',
        content: 'At least 2 players from each squad (including the team IGL) MUST record full gameplay video and internal game audio for every match. Recordings must be submitted to the tournament administration within 30 minutes of match completion if requested. Failure to provide recording results in score forfeiture.',
        order: 6
      },
      {
        category: 'Fair Play',
        title: '7. Anti-Teaming & Sportsmanship',
        content: 'Teaming up with opponent squads, deliberate feeding of kills, colluding to share points, or using abusive language in game chat will result in immediate match disqualification and point deduction penalties.',
        order: 7
      },
      {
        category: 'Disqualification',
        title: '8. Anti-Cheat & Banned Tools Policy',
        content: 'The use of wallhacks, auto-aim, ESP, recoil control modifications, device emulators, iPads, triggers, or modified APK files is strictly banned. Any detection of cheating will result in an immediate lifetime ban for all squad members.',
        order: 8
      },
      {
        category: 'Technical Issues',
        title: '9. Reconnection & Server Crashes',
        content: 'If more than 5 teams fail to load into the lobby due to BGMI server crash before the plane launches, the match will be restarted. Individual player disconnections during match gameplay will not trigger a remake.',
        order: 9
      },
      {
        category: 'Dispute Resolution',
        title: '10. Appeals & Admin Authority',
        content: 'Any dispute regarding match scores, kill counts, or team violations must be submitted via the Support portal within 1 hour of match conclusion. Decisions made by the Tournament Director are final and binding.',
        order: 10
      }
    ];
    await Rule.insertMany(rules);
    console.log('Rules seeded.');

    // 3. SEED NEWS ANNOUNCEMENTS
    console.log('Seeding news bulletins...');
    const announcements = [
      {
        title: 'Squad Registrations Closing Soon',
        content: 'Rosters must be finalized with valid college Student ID cards. Verification is handled immediately by student referees.',
        category: 'Registration',
        date: '2026-08-08',
        priority: 'High',
        published: true
      },
      {
        title: 'Semifinal Match #06 Schedule and Lobby Details Available',
        content: 'Lobby credentials for Match #06 (Miramar) will be dispatched to team captains 15 minutes before 04:00 PM IST. Join your squad voice lobbies.',
        category: 'Schedule',
        date: '2026-08-08',
        priority: 'Urgent',
        published: true
      },
      {
        title: 'Official Results for Match #06 Published',
        content: 'Team Alpha bagged the WWCD with 12 kills! Scorecard proofs and POV recordings have been verified by tournament referees.',
        category: 'Results',
        date: '2026-08-07',
        priority: 'Normal',
        published: true
      },
      {
        title: 'Mandatory Screen Recording & POV Upload Rules Updated',
        content: 'All team IGLs must record 1080p game session audio and video. Failure to upload POV upon referee request will lead to a 5 point penalty.',
        category: 'Rules',
        date: '2026-08-06',
        priority: 'High',
        published: true
      }
    ];
    await Announcement.insertMany(announcements);
    console.log('Announcements seeded.');

    // 4. SEED TEAMS WITH ROSTERS
    console.log('Seeding in-house teams...');
    const teamMocks = [
      {
        name: 'Team Alpha',
        shortName: 'ALPHA',
        college: '[COLLEGE NAME]',
        logo: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&auto=format&fit=crop&q=80',
        banner: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80',
        rank: 1,
        verified: true,
        captain: { name: 'Rohan Sharma', email: 'rohan.sharma@student.in', phone: '+91 98765 43210' },
        registrationId: 'BGMI-2026-001',
        registrationDate: '2026-08-01',
        status: 'Approved',
        players: [
          { name: 'Rohan Sharma', ign: 'AlphaOP', bgmiId: '5123987410', role: 'IGL', verified: true, avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80', studentProof: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', verificationStatus: 'Verified' },
          { name: 'Aditya Verma', ign: 'Alpha_BLAZE', bgmiId: '5123987411', role: 'Assaulter', verified: true, avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80', studentProof: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', verificationStatus: 'Verified' },
          { name: 'Vikram Patel', ign: 'Alpha_SNIPE', bgmiId: '5123987412', role: 'Sniper', verified: true, avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80', studentProof: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', verificationStatus: 'Verified' },
          { name: 'Siddharth Rao', ign: 'Alpha_SHIELD', bgmiId: '5123987413', role: 'Support', verified: true, avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&auto=format&fit=crop&q=80', studentProof: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', verificationStatus: 'Verified' },
          { name: 'Karan Joshi', ign: 'Alpha_GHOST', bgmiId: '5123987414', role: 'Substitute', verified: true, avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80', studentProof: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', verificationStatus: 'Verified' }
        ]
      },
      {
        name: 'Team Titans',
        shortName: 'TITAN',
        college: '[COLLEGE NAME]',
        logo: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=200&auto=format&fit=crop&q=80',
        banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
        rank: 2,
        verified: true,
        captain: { name: 'Aarav Mehta', email: 'aarav@student.in', phone: '+91 98765 43211' },
        registrationId: 'BGMI-2026-002',
        registrationDate: '2026-08-02',
        status: 'Approved',
        players: [
          { name: 'Aarav Mehta', ign: 'Titan_MAMBA', bgmiId: '5123987420', role: 'IGL', verified: true, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', studentProof: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', verificationStatus: 'Verified' },
          { name: 'Kabir Roy', ign: 'Titan_FRAG', bgmiId: '5123987421', role: 'Assaulter', verified: true, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', studentProof: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', verificationStatus: 'Verified' },
          { name: 'Rayan Sen', ign: 'Titan_DEAGLE', bgmiId: '5123987422', role: 'Sniper', verified: true, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80', studentProof: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', verificationStatus: 'Verified' },
          { name: 'Vivaan Kapoor', ign: 'Titan_DOC', bgmiId: '5123987423', role: 'Support', verified: true, avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80', studentProof: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', verificationStatus: 'Verified' }
        ]
      },
      {
        name: 'Phoenix Esports',
        shortName: 'PHNX',
        college: '[COLLEGE NAME]',
        logo: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&auto=format&fit=crop&q=80',
        banner: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80',
        rank: 3,
        verified: true,
        captain: { name: 'Yash Vardhan', email: 'yash@student.in', phone: '+91 98765 43212' },
        registrationId: 'BGMI-2026-003',
        registrationDate: '2026-08-03',
        status: 'Approved',
        players: [
          { name: 'Yash Vardhan', ign: 'PHX_FIRE', bgmiId: '5123987430', role: 'IGL', verified: true, avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80', studentProof: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', verificationStatus: 'Verified' },
          { name: 'Aniket Gupta', ign: 'PHX_ASSAULT', bgmiId: '5123987431', role: 'Assaulter', verified: true, avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80', studentProof: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', verificationStatus: 'Verified' },
          { name: 'Dev Dixit', ign: 'PHX_SCOPE', bgmiId: '5123987432', role: 'Sniper', verified: true, avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80', studentProof: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', verificationStatus: 'Verified' },
          { name: 'Nikhil Kumar', ign: 'PHX_ANCHOR', bgmiId: '5123987433', role: 'Support', verified: true, avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', studentProof: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', verificationStatus: 'Verified' }
        ]
      },
      {
        name: 'Warriors',
        shortName: 'WAR',
        college: '[COLLEGE NAME]',
        logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
        banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
        rank: 4,
        verified: true,
        captain: { name: 'Nikhil Gowda', email: 'nikhil@student.in', phone: '+91 98765 43213' },
        registrationId: 'BGMI-2026-004',
        registrationDate: '2026-08-04',
        status: 'Approved',
        players: [
          { name: 'Nikhil Gowda', ign: 'War_NIX', bgmiId: '5123987440', role: 'IGL', verified: true, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', studentProof: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', verificationStatus: 'Verified' },
          { name: 'Pranav Rao', ign: 'War_PULSE', bgmiId: '5123987441', role: 'Assaulter', verified: true, avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80', studentProof: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', verificationStatus: 'Verified' },
          { name: 'Tejas Murthy', ign: 'War_SHADOW', bgmiId: '5123987442', role: 'Sniper', verified: true, avatar: 'https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?w=150&auto=format&fit=crop&q=80', studentProof: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', verificationStatus: 'Verified' },
          { name: 'Samarth Gowda', ign: 'War_TANK', bgmiId: '5123987443', role: 'Support', verified: true, avatar: 'https://images.unsplash.com/photo-1489980508314-941910ded1f4?w=150&auto=format&fit=crop&q=80', studentProof: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', verificationStatus: 'Verified' }
        ]
      },
      {
        name: 'Revenants',
        shortName: 'REVN',
        college: '[COLLEGE NAME]',
        logo: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&auto=format&fit=crop&q=80',
        banner: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
        rank: 5,
        verified: true,
        captain: { name: 'Anirudh Menon', email: 'anirudh@student.in', phone: '+91 98765 43214' },
        registrationId: 'BGMI-2026-005',
        registrationDate: '2026-08-04',
        status: 'Approved',
        players: [
          { name: 'Anirudh Menon', ign: 'Rev_ANIME', bgmiId: '5123987450', role: 'IGL', verified: true, avatar: 'https://images.unsplash.com/photo-1506803682981-6e718a9dd3ee?w=150&auto=format&fit=crop&q=80', studentProof: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', verificationStatus: 'Verified' },
          { name: 'Sanjay Nair', ign: 'Rev_FRAG', bgmiId: '5123987451', role: 'Assaulter', verified: true, avatar: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=150&auto=format&fit=crop&q=80', studentProof: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', verificationStatus: 'Verified' },
          { name: 'Abhishek Pillai', ign: 'Rev_SLAYER', bgmiId: '5123987452', role: 'Sniper', verified: true, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', studentProof: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', verificationStatus: 'Verified' },
          { name: 'Madhav R', ign: 'Rev_SUPPORT', bgmiId: '5123987453', role: 'Support', verified: true, avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80', studentProof: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', verificationStatus: 'Verified' }
        ]
      },
      {
        name: 'Shadow Squad',
        shortName: 'SHDW',
        college: '[COLLEGE NAME]',
        logo: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200&auto=format&fit=crop&q=80',
        banner: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
        rank: 6,
        verified: true,
        captain: { name: 'Sai Teja', email: 'saiteja@student.in', phone: '+91 98765 43215' },
        registrationId: 'BGMI-2026-006',
        registrationDate: '2026-08-05',
        status: 'Approved',
        players: [
          { name: 'Sai Teja', ign: 'Shadow_SAGE', bgmiId: '5123987460', role: 'IGL', verified: true, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', studentProof: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', verificationStatus: 'Verified' },
          { name: 'Rahul Ch', ign: 'Shadow_RIFT', bgmiId: '5123987461', role: 'Assaulter', verified: true, avatar: 'https://images.unsplash.com/photo-1489980508314-941910ded1f4?w=150&auto=format&fit=crop&q=80', studentProof: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', verificationStatus: 'Verified' },
          { name: 'Varun Reddy', ign: 'Shadow_PHX', bgmiId: '5123987462', role: 'Sniper', verified: true, avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80', studentProof: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', verificationStatus: 'Verified' },
          { name: 'Harsha V', ign: 'Shadow_AEGIS', bgmiId: '5123987463', role: 'Support', verified: true, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', studentProof: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', verificationStatus: 'Verified' }
        ]
      },
      {
        name: 'Vanguard',
        shortName: 'VNGD',
        college: '[COLLEGE NAME]',
        logo: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&auto=format&fit=crop&q=80',
        banner: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
        rank: 7,
        verified: true,
        captain: { name: 'Dinesh Kumar', email: 'dinesh@student.in', phone: '+91 98765 43216' },
        registrationId: 'BGMI-2026-007',
        registrationDate: '2026-08-05',
        status: 'Approved',
        players: [
          { name: 'Dinesh Kumar', ign: 'Van_DRACO', bgmiId: '5123987470', role: 'IGL', verified: true, avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80', studentProof: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', verificationStatus: 'Verified' },
          { name: 'Vijay Ram', ign: 'Van_VULCAN', bgmiId: '5123987471', role: 'Assaulter', verified: true, avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80', studentProof: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', verificationStatus: 'Verified' },
          { name: 'Suraj S', ign: 'Van_SABRE', bgmiId: '5123987472', role: 'Sniper', verified: true, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', studentProof: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', verificationStatus: 'Verified' },
          { name: 'Ajay K', ign: 'Van_WARDEN', bgmiId: '5123987473', role: 'Support', verified: true, avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80', studentProof: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', verificationStatus: 'Verified' }
        ]
      },
      {
        name: 'Cyber Knights',
        shortName: 'CYBER',
        college: '[COLLEGE NAME]',
        logo: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=200&auto=format&fit=crop&q=80',
        banner: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&auto=format&fit=crop&q=80',
        rank: 8,
        verified: true,
        captain: { name: 'Karthik Prabhu', email: 'karthik@student.in', phone: '+91 98765 43217' },
        registrationId: 'BGMI-2026-008',
        registrationDate: '2026-08-05',
        status: 'Approved',
        players: [
          { name: 'Karthik Prabhu', ign: 'Cyber_KNGHT', bgmiId: '5123987480', role: 'IGL', verified: true, avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80', studentProof: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', verificationStatus: 'Verified' },
          { name: 'Pranav Bhat', ign: 'Cyber_PRO', bgmiId: '5123987481', role: 'Assaulter', verified: true, avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80', studentProof: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', verificationStatus: 'Verified' },
          { name: 'Rohit K', ign: 'Cyber_RAGE', bgmiId: '5123987482', role: 'Sniper', verified: true, avatar: 'https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?w=150&auto=format&fit=crop&q=80', studentProof: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', verificationStatus: 'Verified' },
          { name: 'Sumit Shenoy', ign: 'Cyber_AEGIS', bgmiId: '5123987483', role: 'Support', verified: true, avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80', studentProof: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', verificationStatus: 'Verified' }
        ]
      },
      {
        name: 'Gladiators',
        shortName: 'GLAD',
        college: '[COLLEGE NAME]',
        logo: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&auto=format&fit=crop&q=80',
        banner: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80',
        rank: 0,
        verified: false,
        captain: { name: 'Aman Deep', email: 'aman@student.in', phone: '+91 98765 99901' },
        registrationId: 'BGMI-2026-009',
        registrationDate: '2026-08-08',
        status: 'Pending',
        players: [
          { name: 'Aman Deep', ign: 'Glad_AMAN', bgmiId: '5123987490', role: 'IGL', verified: false, avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80', studentProof: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', verificationStatus: 'Pending Verification' },
          { name: 'Suhail Khan', ign: 'Glad_ZEUS', bgmiId: '5123987491', role: 'Assaulter', verified: false, avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80', studentProof: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', verificationStatus: 'Pending Verification' },
          { name: 'Abhay Sen', ign: 'Glad_HERO', bgmiId: '5123987492', role: 'Sniper', verified: false, avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80', studentProof: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', verificationStatus: 'Pending Verification' },
          { name: 'Ritvik Murthy', ign: 'Glad_SUPPORT', bgmiId: '5123987493', role: 'Support', verified: false, avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&auto=format&fit=crop&q=80', studentProof: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', verificationStatus: 'Pending Verification' }
        ]
      }
    ];

    const seededTeams = await Team.insertMany(teamMocks);
    console.log(`Seeded ${seededTeams.length} teams.`);

    // 5. SEED MATCHES
    console.log('Seeding tournament match schedules...');
    const participatingTeamsFormatted = seededTeams
      .filter(t => t.status === 'Approved')
      .map(t => ({ id: t._id.toString(), name: t.name, shortName: t.shortName }));

    const matchesMocks = [
      {
        matchNumber: 1,
        title: 'Match #01 - Group Stage Erangel Opener',
        round: 'Group Stage',
        map: 'Erangel',
        date: '2026-08-05',
        time: '02:00 PM',
        status: 'Completed',
        teamsCount: participatingTeamsFormatted.length,
        participatingTeams: participatingTeamsFormatted
      },
      {
        matchNumber: 2,
        title: 'Match #02 - Group Stage Miramar Scuffle',
        round: 'Group Stage',
        map: 'Miramar',
        date: '2026-08-05',
        time: '05:00 PM',
        status: 'Completed',
        teamsCount: participatingTeamsFormatted.length,
        participatingTeams: participatingTeamsFormatted
      },
      {
        matchNumber: 3,
        title: 'Match #03 - Group Stage Vikendi Freeze',
        round: 'Group Stage',
        map: 'Vikendi',
        date: '2026-08-06',
        time: '02:00 PM',
        status: 'Completed',
        teamsCount: participatingTeamsFormatted.length,
        participatingTeams: participatingTeamsFormatted
      },
      {
        matchNumber: 4,
        title: 'Match #04 - Quarterfinal Erangel Assault',
        round: 'Quarterfinal',
        map: 'Erangel',
        date: '2026-08-06',
        time: '05:00 PM',
        status: 'Completed',
        teamsCount: participatingTeamsFormatted.length,
        participatingTeams: participatingTeamsFormatted
      },
      {
        matchNumber: 5,
        title: 'Match #05 - Quarterfinal Sanhok Survival',
        round: 'Quarterfinal',
        map: 'Sanhok',
        date: '2026-08-07',
        time: '01:30 PM',
        status: 'Completed',
        teamsCount: participatingTeamsFormatted.length,
        participatingTeams: participatingTeamsFormatted
      },
      {
        matchNumber: 6,
        title: 'Match #06 - Semifinal Miramar Battle',
        round: 'Semifinal',
        map: 'Miramar',
        date: '2026-08-07',
        time: '04:00 PM',
        status: 'Completed',
        teamsCount: participatingTeamsFormatted.length,
        participatingTeams: participatingTeamsFormatted
      },
      {
        matchNumber: 7,
        title: 'Match #07 - Semifinal Group A vs B',
        round: 'Semifinal',
        map: 'Erangel',
        date: '2026-08-08',
        time: '10:30 AM',
        status: 'Upcoming',
        teamsCount: participatingTeamsFormatted.length,
        participatingTeams: participatingTeamsFormatted
      },
      {
        matchNumber: 8,
        title: 'Match #08 - Grand Final Showdown',
        round: 'Grand Final',
        map: 'Miramar',
        date: '2026-08-08',
        time: '06:00 PM',
        status: 'Upcoming',
        teamsCount: participatingTeamsFormatted.length,
        participatingTeams: participatingTeamsFormatted
      }
    ];

    const seededMatches = await Match.insertMany(matchesMocks);
    console.log(`Seeded ${seededMatches.length} matches.`);

    // Helper to find team id by name
    const findTeamId = (name) => {
      const match = seededTeams.find(t => t.name === name);
      return match ? match._id.toString() : null;
    };

    // 6. SEED MATCH RESULTS (AND AUTO CALCULATE TEAMS POINTS)
    console.log('Seeding match results scorecards...');
    
    // We will seed results for Matches 3, 4, 5, 6
    const resultsMocks = [
      {
        matchNumber: 3,
        round: 'Group Stage',
        map: 'Vikendi',
        date: '2026-08-06',
        winnerTeam: 'Team Alpha',
        mvp: {
          name: 'Rohan Sharma (AlphaOP)',
          team: 'Team Alpha',
          kills: 6,
          damage: 790,
          avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80'
        },
        scores: [
          { rank: 1, team: 'Team Alpha', placementPts: 15, kills: 15, killPts: 15, total: 30 },
          { rank: 2, team: 'Team Titans', placementPts: 12, kills: 8, killPts: 8, total: 20 },
          { rank: 3, team: 'Revenants', placementPts: 10, kills: 5, killPts: 5, total: 15 },
          { rank: 4, team: 'Phoenix Esports', placementPts: 8, kills: 4, killPts: 4, total: 12 }
        ]
      },
      {
        matchNumber: 4,
        round: 'Quarterfinal',
        map: 'Erangel',
        date: '2026-08-06',
        winnerTeam: 'Phoenix Esports',
        mvp: {
          name: 'Yash Vardhan (PHX_FIRE)',
          team: 'Phoenix Esports',
          kills: 5,
          damage: 640,
          avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80'
        },
        scores: [
          { rank: 1, team: 'Phoenix Esports', placementPts: 15, kills: 10, killPts: 10, total: 25 },
          { rank: 2, team: 'Team Alpha', placementPts: 12, kills: 6, killPts: 6, total: 18 },
          { rank: 3, team: 'Warriors', placementPts: 10, kills: 7, killPts: 7, total: 17 },
          { rank: 4, team: 'Team Titans', placementPts: 8, kills: 3, killPts: 3, total: 11 }
        ]
      },
      {
        matchNumber: 5,
        round: 'Quarterfinal',
        map: 'Sanhok',
        date: '2026-08-07',
        winnerTeam: 'Team Titans',
        mvp: {
          name: 'Kabir Roy (Titan_FRAG)',
          team: 'Team Titans',
          kills: 7,
          damage: 1020,
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
        },
        scores: [
          { rank: 1, team: 'Team Titans', placementPts: 15, kills: 14, killPts: 14, total: 29 },
          { rank: 2, team: 'Team Alpha', placementPts: 12, kills: 8, killPts: 8, total: 20 },
          { rank: 3, team: 'Revenants', placementPts: 10, kills: 6, killPts: 6, total: 16 },
          { rank: 4, team: 'Phoenix Esports', placementPts: 8, kills: 4, killPts: 4, total: 12 }
        ]
      },
      {
        matchNumber: 6,
        round: 'Semifinal',
        map: 'Miramar',
        date: '2026-08-07',
        winnerTeam: 'Team Alpha',
        mvp: {
          name: 'Aditya Verma (Alpha_BLAZE)',
          team: 'Team Alpha',
          kills: 6,
          damage: 840,
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
        },
        scores: [
          { rank: 1, team: 'Team Alpha', placementPts: 15, kills: 12, killPts: 12, total: 27 },
          { rank: 2, team: 'Team Titans', placementPts: 12, kills: 9, killPts: 9, total: 21 },
          { rank: 3, team: 'Phoenix Esports', placementPts: 10, kills: 7, killPts: 7, total: 17 },
          { rank: 4, team: 'Warriors', placementPts: 8, kills: 5, killPts: 5, total: 13 },
          { rank: 5, team: 'Revenants', placementPts: 6, kills: 6, killPts: 6, total: 12 },
          { rank: 6, team: 'Shadow Squad', placementPts: 4, kills: 3, killPts: 3, total: 7 },
          { rank: 7, team: 'Vanguard', placementPts: 2, kills: 2, killPts: 2, total: 4 },
          { rank: 8, team: 'Cyber Knights', placementPts: 1, kills: 1, killPts: 1, total: 2 }
        ]
      }
    ];

    for (const r of resultsMocks) {
      const matchDoc = seededMatches.find(m => m.matchNumber === r.matchNumber);
      if (!matchDoc) continue;

      const leaderboardProcessed = r.scores.map(s => ({
        rank: s.rank,
        team: s.team,
        teamId: findTeamId(s.team),
        placementPts: s.placementPts,
        kills: s.kills,
        killPts: s.killPts,
        total: s.total,
        bonus: s.rank === 1 ? 0 : 0,
        penalty: 0
      }));

      const winnerTeamDoc = seededTeams.find(t => t.name === r.winnerTeam);

      const resultDoc = await MatchResult.create({
        matchId: matchDoc._id.toString(),
        matchNumber: r.matchNumber,
        round: r.round,
        map: r.map,
        date: r.date,
        winner: {
          teamId: winnerTeamDoc._id.toString(),
          teamName: winnerTeamDoc.name,
          logo: winnerTeamDoc.logo,
          kills: leaderboardProcessed.find(l => l.teamId === winnerTeamDoc._id.toString()).kills,
          placementPoints: leaderboardProcessed.find(l => l.teamId === winnerTeamDoc._id.toString()).placementPts,
          totalPoints: leaderboardProcessed.find(l => l.teamId === winnerTeamDoc._id.toString()).total
        },
        mvp: r.mvp,
        leaderboard: leaderboardProcessed,
        proofs: {
          screenshots: [
            'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80'
          ],
          povVideos: [
            { title: 'Winner POV highlight clutch', url: 'https://youtube.com/watch?v=example1' }
          ]
        },
        published: true
      });

      // Update Match with winner stats
      matchDoc.status = 'Completed';
      matchDoc.winner = {
        id: winnerTeamDoc._id.toString(),
        name: winnerTeamDoc.name,
        shortName: winnerTeamDoc.shortName,
        kills: resultDoc.winner.kills,
        points: resultDoc.winner.totalPoints
      };
      matchDoc.topFragger = {
        name: r.mvp.name,
        team: r.mvp.team,
        kills: r.mvp.kills
      };
      await matchDoc.save();
    }
    console.log('Seeded match results scorecards.');

    // 7. AGGREGATE TEAM TOTAL POINTS FROM SEEDED RESULTS
    console.log('Aggregating team overall scores from results...');
    const allResults = await MatchResult.find({});
    for (const team of seededTeams) {
      if (team.status !== 'Approved') continue;

      let totalPoints = 0;
      let totalKills = 0;
      let totalWWCD = 0;
      let matchesPlayed = 0;

      allResults.forEach(r => {
        const entry = r.leaderboard.find(e => e.teamId === team._id.toString());
        if (entry) {
          totalPoints += entry.total;
          totalKills += entry.kills;
          matchesPlayed += 1;
          if (entry.rank === 1) {
            totalWWCD += 1;
          }
        }
      });

      team.points = totalPoints;
      team.kills = totalKills;
      team.wwcd = totalWWCD;
      team.matchesPlayed = matchesPlayed;

      // Realistically spread player kills
      if (team.players && team.players.length > 0) {
         const count = team.players.length;
         const avg = Math.floor(totalKills / count);
         team.players.forEach((p, idx) => {
           p.kills = avg + (idx === 0 ? totalKills % count : 0);
           p.kdRatio = matchesPlayed > 0 ? parseFloat((p.kills / matchesPlayed).toFixed(2)) : 0;
         });
      }

      await team.save();
    }
    console.log('Aggregated and updated team points.');

    // 8. SEED MEDIA POV FILES
    console.log('Seeding media gallery POV records...');
    const mediaMocks = [
      {
        title: 'Match #06 Final Circle Wipeout Highlights',
        type: 'POV',
        team: 'Team Alpha',
        player: 'Aditya Verma (Alpha_BLAZE)',
        match: 'Match #06',
        thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        verified: true,
        status: 'Published',
        date: '2026-08-07'
      },
      {
        title: 'Team Titans Victory Celebration',
        type: 'Team Photos',
        team: 'Team Titans',
        player: 'Full Roster',
        match: 'Match #05',
        thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80',
        imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80',
        verified: true,
        status: 'Published',
        date: '2026-08-07'
      },
      {
        title: 'Match #06 Scorecard Proof Record',
        type: 'Results',
        team: 'Official Referee',
        player: 'N/A',
        match: 'Match #06',
        thumbnail: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80',
        imageUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop&q=80',
        verified: true,
        status: 'Published',
        date: '2026-08-07'
      },
      {
        title: 'Phoenix Yash 1v3 Clutch Moment POV',
        type: 'POV',
        team: 'Phoenix Esports',
        player: 'Yash Vardhan',
        match: 'Match #04',
        thumbnail: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&auto=format&fit=crop&q=80',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        verified: true,
        status: 'Published',
        date: '2026-08-06'
      },
      {
        title: 'Warriors Player Spotlight Profile',
        type: 'Player Photos',
        team: 'Warriors',
        player: 'Nikhil Gowda',
        match: 'Media Day',
        thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
        imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&auto=format&fit=crop&q=80',
        verified: true,
        status: 'Published',
        date: '2026-08-05'
      },
      {
        title: 'Match #03 In-Game Tactical Airdrop Screenshot',
        type: 'Screenshots',
        team: 'Revenants',
        player: 'Anirudh Menon',
        match: 'Match #03',
        thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
        imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
        verified: false,
        status: 'Pending Review',
        date: '2026-08-06'
      }
    ];

    await Media.insertMany(mediaMocks);
    console.log('Seeded media gallery items.');

    console.log('Database Seeding Completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding database failed:', error.message);
    process.exit(1);
  }
};

seedDatabase();
