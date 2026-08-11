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
        content: 'Only current students of NIT are allowed to participate in this tournament. External players, guest teams, and students from other universities are strictly prohibited. All participants must hold a valid college roll number and active student status.',
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
    const teamMocks = [];

    const seededTeams = await Team.insertMany(teamMocks);
    console.log(`Seeded ${seededTeams.length} teams.`);

    // 5. SEED MATCHES
    console.log('Seeding tournament match schedules...');
    const participatingTeamsFormatted = [];

    const matchesMocks = [
      {
        matchNumber: 1,
        title: 'Match #1 — Erangel',
        round: 'Match 1',
        map: 'Erangel',
        date: '2026-08-08',
        time: '10:00 AM',
        status: 'Upcoming',
        teamsCount: participatingTeamsFormatted.length,
        participatingTeams: participatingTeamsFormatted
      },
      {
        matchNumber: 2,
        title: 'Match #2 — Livik',
        round: 'Match 2',
        map: 'Livik',
        date: '2026-08-08',
        time: '12:30 PM',
        status: 'Upcoming',
        teamsCount: participatingTeamsFormatted.length,
        participatingTeams: participatingTeamsFormatted
      },
      {
        matchNumber: 3,
        title: 'Match #3 — Livik',
        round: 'Match 3',
        map: 'Livik',
        date: '2026-08-08',
        time: '03:30 PM',
        status: 'Upcoming',
        teamsCount: participatingTeamsFormatted.length,
        participatingTeams: participatingTeamsFormatted
      },
      {
        matchNumber: 4,
        title: 'Match #4 — Erangel',
        round: 'Match 4',
        map: 'Erangel',
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
    
    const resultsMocks = [];

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
    const mediaMocks = [];

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
