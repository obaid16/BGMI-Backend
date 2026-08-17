
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
      email: 'obaidullahshaikh07@gmail.com',
      password: 'obaid2310', // Will be hashed by pre-save middleware
      role: 'SUPER_ADMIN'
    });
    console.log('Admin user seeded (obaidullahshaikh07@gmail.com / obaid2310).');

    // 2. SEED HANDBOOK RULES (In-house Championship Rules)
    console.log('Seeding rules handbook...');
    const rules = [
      {
        category: 'Eligibility',
        title: '1. Roster Eligibility & Enrollment',
        content: 'Only current students of NIT Srinagar are allowed to participate in this tournament. External players, guest teams, and students from other universities are prohibited. All participants must hold a valid college roll number and active student status.',
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
        date: '2026-09-02',
        priority: 'High',
        published: true
      },
      {
        title: 'Semifinal Match #03 Schedule and Lobby Details Available',
        content: 'Lobby credentials for Match #03 (Erangel) will be dispatched to team captains 15 minutes before 03:30 PM IST. Join your squad voice lobbies.',
        category: 'Schedule',
        date: '2026-09-02',
        priority: 'Urgent',
        published: true
      },
      {
        title: 'Official Results for Match #02 Published',
        content: 'Soul Esports bagged the WWCD with 10 kills! Scorecard proofs and POV recordings have been verified by tournament referees.',
        category: 'Results',
        date: '2026-09-02',
        priority: 'Normal',
        published: true
      },
      {
        title: 'Official Results for Match #01 Published',
        content: 'GodLike Esports bagged the WWCD with 8 kills! Scorecard proofs and POV recordings have been verified by tournament referees.',
        category: 'Results',
        date: '2026-09-02',
        priority: 'Normal',
        published: true
      }
    ];
    await Announcement.insertMany(announcements);
    console.log('Announcements seeded.');

    // 4. SEED TEAMS WITH ROSTERS
    console.log('Seeding in-house teams...');
    const teamMocks = [
      {
        name: 'GodLike Esports',
        shortName: 'GODL',
        college: 'NIT Computer Science Dept',
        logo: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&auto=format&fit=crop&q=80',
        banner: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80',
        captain: { name: 'Obaid Shaikh', email: 'obaid@nitesports.edu', phone: '9876543210' },
        registrationId: 'GODL-2026',
        status: 'Approved',
        verified: true,
        rank: 1,
        players: [
          { name: 'Obaid Shaikh', ign: 'OBAID (IGL)', bgmiId: '512938401', role: 'IGL / Assaulter', verified: true, verificationStatus: 'Verified', kills: 10, matchesPlayed: 2, kdRatio: 5.00 },
          { name: 'Jonathan Amaral', ign: 'GODL-Jonathan', bgmiId: '512938402', role: 'Entry Fragger', verified: true, verificationStatus: 'Verified', kills: 8, matchesPlayed: 2, kdRatio: 4.00 },
          { name: 'Abhishek Choudhary', ign: 'GODL-Zgod', bgmiId: '512938403', role: 'Support', verified: true, verificationStatus: 'Verified', kills: 5, matchesPlayed: 2, kdRatio: 2.50 },
          { name: 'Harsh Paudwal', ign: 'GODL-Goblin', bgmiId: '512938404', role: 'Filter Assaulter', verified: true, verificationStatus: 'Verified', kills: 3, matchesPlayed: 2, kdRatio: 1.50 }
        ]
      },
      {
        name: 'Axions',
        shortName: 'AXN',
        college: 'NIT Electronics Engineering',
        logo: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200&auto=format&fit=crop&q=80',
        banner: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80',
        captain: { name: 'Kratos', email: 'kratos@nitesports.edu', phone: '9876543211' },
        registrationId: 'AXN-2026',
        status: 'Approved',
        verified: true,
        rank: 2,
        players: [
          { name: 'Kratos', ign: 'AXN-Kratos', bgmiId: '512938405', role: 'IGL', verified: true, verificationStatus: 'Verified', kills: 7, matchesPlayed: 2, kdRatio: 3.50 },
          { name: 'Shadow', ign: 'AXN-Shadow', bgmiId: '512938406', role: 'Assaulter', verified: true, verificationStatus: 'Verified', kills: 5, matchesPlayed: 2, kdRatio: 2.50 },
          { name: 'Viper', ign: 'AXN-Viper', bgmiId: '512938407', role: 'Support', verified: true, verificationStatus: 'Verified', kills: 2, matchesPlayed: 2, kdRatio: 1.00 },
          { name: 'Snax', ign: 'AXN-Snax', bgmiId: '512938408', role: 'Sniper', verified: true, verificationStatus: 'Verified', kills: 1, matchesPlayed: 2, kdRatio: 0.50 }
        ]
      },
      {
        name: 'Elite Warriors',
        shortName: 'ELT',
        college: 'NIT Mechanical Dept',
        logo: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=200&auto=format&fit=crop&q=80',
        banner: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80',
        captain: { name: 'Naman Mathur', email: 'mortal@nitesports.edu', phone: '9876543212' },
        registrationId: 'ELT-2026',
        status: 'Approved',
        verified: true,
        rank: 3,
        players: [
          { name: 'Naman Mathur', ign: 'ELT-Mortal', bgmiId: '512938409', role: 'IGL / Support', verified: true, verificationStatus: 'Verified', kills: 6, matchesPlayed: 2, kdRatio: 3.00 },
          { name: 'Tanmay Singh', ign: 'ELT-Scout', bgmiId: '512938410', role: 'Entry Fragger', verified: true, verificationStatus: 'Verified', kills: 4, matchesPlayed: 2, kdRatio: 2.00 },
          { name: 'Siddharth Joshi', ign: 'ELT-Regaltos', bgmiId: '512938411', role: 'Assaulter', verified: true, verificationStatus: 'Verified', kills: 3, matchesPlayed: 2, kdRatio: 1.50 },
          { name: 'Vivek Awasthi', ign: 'ELT-ClutchGod', bgmiId: '512938412', role: 'Filter', verified: true, verificationStatus: 'Verified', kills: 1, matchesPlayed: 2, kdRatio: 0.50 }
        ]
      },
      {
        name: '401 Unauthorized',
        shortName: '401',
        college: 'NIT Information Technology',
        logo: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=200&auto=format&fit=crop&q=80',
        banner: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80',
        captain: { name: 'CyberDev', email: 'cyber@nitesports.edu', phone: '9876543213' },
        registrationId: '401-2026',
        status: 'Approved',
        verified: true,
        rank: 4,
        players: [
          { name: 'CyberDev', ign: '401-Cyber', bgmiId: '512938413', role: 'IGL', verified: true, verificationStatus: 'Verified', kills: 4, matchesPlayed: 2, kdRatio: 2.00 },
          { name: 'Kernel', ign: '401-Kernel', bgmiId: '512938414', role: 'Assaulter', verified: true, verificationStatus: 'Verified', kills: 3, matchesPlayed: 2, kdRatio: 1.50 },
          { name: 'Root', ign: '401-Root', bgmiId: '512938415', role: 'Support', verified: true, verificationStatus: 'Verified', kills: 2, matchesPlayed: 2, kdRatio: 1.00 },
          { name: 'Buffer', ign: '401-Buffer', bgmiId: '512938416', role: 'Sniper', verified: true, verificationStatus: 'Verified', kills: 1, matchesPlayed: 2, kdRatio: 0.50 }
        ]
      },
      {
        name: 'FARZ Esports',
        shortName: 'FRZ',
        college: 'NIT Civil Engineering',
        logo: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=200&auto=format&fit=crop&q=80',
        banner: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80',
        captain: { name: 'Farzan', email: 'farzan@nitesports.edu', phone: '9876543214' },
        registrationId: 'FRZ-2026',
        status: 'Approved',
        verified: true,
        rank: 5,
        players: [
          { name: 'Farzan', ign: 'FRZ-Farzan', bgmiId: '512938417', role: 'IGL', verified: true, verificationStatus: 'Verified', kills: 2, matchesPlayed: 2, kdRatio: 1.00 },
          { name: 'Apex', ign: 'FRZ-Apex', bgmiId: '512938418', role: 'Assaulter', verified: true, verificationStatus: 'Verified', kills: 1, matchesPlayed: 2, kdRatio: 0.50 },
          { name: 'Titan', ign: 'FRZ-Titan', bgmiId: '512938419', role: 'Support', verified: true, verificationStatus: 'Verified', kills: 1, matchesPlayed: 2, kdRatio: 0.50 },
          { name: 'Blaze', ign: 'FRZ-Blaze', bgmiId: '512938420', role: 'Sniper', verified: true, verificationStatus: 'Verified', kills: 1, matchesPlayed: 2, kdRatio: 0.50 }
        ]
      }
    ];

    const seededTeams = await Team.insertMany(teamMocks);
    console.log(`Seeded ${seededTeams.length} teams.`);

    // 5. SEED MATCHES
    console.log('Seeding tournament match schedules...');
    const participatingTeamsFormatted = seededTeams.map(t => ({
      id: t._id.toString(),
      name: t.name,
      shortName: t.shortName
    }));

    const matchesMocks = [
      {
        matchNumber: 1,
        title: 'Match #1 — Erangel',
        round: 'Match 1',
        map: 'Erangel',
        date: '2026-09-02',
        time: '10:00 AM',
        status: 'Completed',
        teamsCount: participatingTeamsFormatted.length,
        participatingTeams: participatingTeamsFormatted
      },
      {
        matchNumber: 2,
        title: 'Match #2 — Livik',
        round: 'Match 2',
        map: 'Livik',
        date: '2026-09-02',
        time: '12:30 PM',
        status: 'Completed',
        teamsCount: participatingTeamsFormatted.length,
        participatingTeams: participatingTeamsFormatted
      },
      {
        matchNumber: 3,
        title: 'Match #3 — Livik',
        round: 'Match 3',
        map: 'Livik',
        date: '2026-09-02',
        time: '03:30 PM',
        status: 'Live',
        teamsCount: participatingTeamsFormatted.length,
        participatingTeams: participatingTeamsFormatted
      },
      {
        matchNumber: 4,
        title: 'Match #4 — Erangel',
        round: 'Match 4',
        map: 'Erangel',
        date: '2026-09-02',
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
    const resultsMocks = [
      {
        matchNumber: 1,
        round: 'Match 1',
        map: 'Erangel',
        date: '2026-09-02',
        winnerTeam: 'GodLike Esports',
        mvp: { name: 'Obaid Shaikh', ign: 'OBAID (IGL)', team: 'GodLike Esports', kills: 6 },
        scores: [
          { rank: 1, team: 'GodLike Esports', placementPts: 10, kills: 14, killPts: 14, total: 24 },
          { rank: 2, team: 'Elite Warriors', placementPts: 8, kills: 9, killPts: 9, total: 17 },
          { rank: 3, team: 'Axions', placementPts: 5, kills: 7, killPts: 7, total: 12 },
          { rank: 4, team: '401 Unauthorized', placementPts: 3, kills: 4, killPts: 4, total: 7 },
          { rank: 5, team: 'FARZ Esports', placementPts: 1, kills: 3, killPts: 3, total: 4 }
        ]
      },
      {
        matchNumber: 2,
        round: 'Match 2',
        map: 'Livik',
        date: '2026-09-02',
        winnerTeam: 'GodLike Esports',
        mvp: { name: 'Obaid Shaikh', ign: 'OBAID (IGL)', team: 'GodLike Esports', kills: 4 },
        scores: [
          { rank: 1, team: 'GodLike Esports', placementPts: 10, kills: 12, killPts: 12, total: 22 },
          { rank: 2, team: 'Axions', placementPts: 8, kills: 8, killPts: 8, total: 16 },
          { rank: 3, team: '401 Unauthorized', placementPts: 5, kills: 6, killPts: 6, total: 11 },
          { rank: 4, team: 'Elite Warriors', placementPts: 3, kills: 5, killPts: 5, total: 8 },
          { rank: 5, team: 'FARZ Esports', placementPts: 1, kills: 2, killPts: 2, total: 3 }
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
        bonus: 0,
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
        title: 'Match 1 WWCD Screen - 8 Kills',
        type: 'Screenshots',
        team: 'GodLike Esports',
        player: 'GODL-Jonathan',
        match: 'Match #1 - Erangel',
        thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
        imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80',
        verified: true,
        status: 'Published'
      },
      {
        title: 'Match 2 WWCD Screen - 10 Kills',
        type: 'Screenshots',
        team: 'Soul Esports',
        player: 'SOUL-Goblin',
        match: 'Match #2 - Livik',
        thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
        imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80',
        verified: true,
        status: 'Published'
      },
      {
        title: 'GODL Jonathan 1v3 Clutch highlights',
        type: 'POV',
        team: 'GodLike Esports',
        player: 'GODL-Jonathan',
        match: 'Match #1 - Erangel',
        thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        verified: true,
        status: 'Published'
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
