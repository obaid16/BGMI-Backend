
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

    // 1. SEED DEFAULT ADMINISTRATORS (SUPER_ADMIN & ADMIN)
    console.log('Seeding default administrators...');
    await User.create([
      {
        name: 'Tournament Director',
        email: 'admin1@bgmi.esports',
        password: 'Admin1#BGMI2026',
        role: 'SUPER_ADMIN'
      },
      {
        name: 'Operations Referee',
        email: 'admin2@bgmi.esports',
        password: 'Admin2#BGMI2026',
        role: 'ADMIN'
      }
    ]);
    console.log('Admin users seeded (admin1@bgmi.esports / admin2@bgmi.esports).');

    // 2. SEED HANDBOOK RULES (Official NIT BGMI Rules PDF)
    console.log('Seeding official rules handbook...');
    const rules = [
      {
        category: 'Device & Equipment',
        title: '01. Device & Equipment Rules',
        content: '1. Only mobile phones are allowed for participation in the tournament.\n2. Tablets, iPads, emulators, laptops, PCs, or any other devices are strictly prohibited.\n3. Every player must use their registered BGMI account throughout the tournament.\n4. Players are not allowed to switch accounts or play using another player\'s account.\n5. Players are responsible for ensuring that their device has sufficient battery, storage, internet connection, and the required BGMI version before every match.\n6. Players must keep their devices ready before the scheduled match time.',
        order: 1,
        published: true
      },
      {
        category: 'Fair Play & Anti-Cheat',
        title: '02. Hacking, Cheating & Unfair Play — Zero Tolerance',
        content: '1. The use of hacks, cheats, scripts, injectors, game-file modifications, config modifications, unauthorized applications, or any third-party tools that provide an unfair advantage is strictly prohibited.\n2. Any attempt to gain an unfair advantage will be treated as a serious violation.\n3. The tournament will use Advanced Room Cards, and the organizers reserve the right to remove or ban a player immediately if cheating, hacking, or suspicious activity is detected.\n4. A player found using cheats or hacks may be immediately disqualified from the tournament.\n5. A banned player will not be allowed to participate in any remaining matches of the tournament.\n6. Depending on the severity of the violation, the entire team may also be disqualified.\n7. Claiming that the hack/cheat was accidental, borrowed, or caused by another person will not automatically excuse the violation.\n\nNO HACKS • NO CHEATS • NO THIRD-PARTY TOOLS • PLAY FAIR',
        order: 2,
        published: true
      },
      {
        category: 'Slot & Bootcamp',
        title: '03. Slot & Bootcamp Allocation',
        content: '1. The organizers will assign every team a specific Slot/Bootcamp Number.\n2. Once your respective slot number is announced, your team must stay in its assigned slot.\n3. Players are not allowed to move to, sit in, or occupy another team\'s slot/Bootcamp.\n4. Players must not switch slots during a match without permission from the tournament organizers.\n5. Players from different teams must not intentionally gather in another team\'s assigned Bootcamp.\n6. If a player needs to leave their assigned slot for any genuine reason, they must first inform the organizer and receive permission.\n7. Repeatedly ignoring slot instructions may result in a warning, penalty, or disqualification.\n\nYOUR SLOT IS YOUR TEAM\'S DESIGNATED AREA — DO NOT MOVE TO ANOTHER TEAM\'S SLOT',
        order: 3,
        published: true
      },
      {
        category: 'Match & Room',
        title: '04. Match & Room Rules',
        content: '1. Players must join their respective room before the scheduled match start time.\n2. Players must join the correct room assigned by the organizers.\n3. Room ID and password will be provided by the organizers.\n4. Room ID and password must not be shared with non-participating players.\n5. Players must follow all instructions given by the room administrators and tournament organizers.\n6. Once the match has started, late entry may not be guaranteed.\n7. Players must not intentionally disrupt the room or delay the start of a match.\n8. Players must remain in their assigned physical slot/Bootcamp during the match unless permission is given by the organizer.',
        order: 4,
        published: true
      },
      {
        category: 'Elimination Protocol',
        title: '05. After Elimination Protocols',
        content: '1. Once a player or team is eliminated from a match, they must remain in their respective assigned Bootcamp/slot.\n2. Eliminated players are not allowed to move to another team\'s Bootcamp or slot.\n3. Eliminated players must wait until the entire match has officially ended.\n4. Eliminated players must not provide any information to teams that are still playing.\n5. No coaching, enemy-location information, callouts, or strategic information may be given to active players after elimination.\n6. Players must not intentionally communicate with active players for the purpose of influencing the ongoing match.\n7. Players may leave their assigned Bootcamp only after the match has completely ended and the organizer permits them to do so.\n\nELIMINATED? STAY IN YOUR BOOTCAMP UNTIL THE MATCH ENDS',
        order: 5,
        published: true
      },
      {
        category: 'Team & Roster',
        title: '06. Team & Player Rules',
        content: '1. Only registered players are allowed to participate.\n2. No unregistered player may play in place of a registered player.\n3. Players cannot change teams after the tournament has started.\n4. Players must use their registered in-game identity/details.\n5. Players must not intentionally help another team.\n6. Teaming or collusion between teams is strictly prohibited.\n7. Any attempt to manipulate the result of a match may result in immediate disqualification.',
        order: 6,
        published: true
      },
      {
        category: 'Sportsmanship',
        title: '07. Fair Play & Sportsmanship',
        content: 'All players are expected to maintain proper sportsmanship throughout the tournament. The following behaviour is prohibited:\n• Abusive or offensive language toward organizers or players\n• Threatening behaviour\n• Fighting or physical confrontation\n• Deliberately disturbing another team\n• Intentionally distracting players during a match\n• Harassment of other participants\n• Disrespectful behaviour toward tournament staff\n• Deliberate damage to tournament property or equipment\n\nSERIOUS MISCONDUCT MAY RESULT IN IMMEDIATE REMOVAL FROM THE TOURNAMENT',
        order: 7,
        published: true
      },
      {
        category: 'Exploits',
        title: '08. Bugs, Glitches & Exploits',
        content: '1. Players are not allowed to intentionally exploit any game bug or glitch to gain an unfair advantage.\n2. If a player discovers a serious game-breaking issue, they must report it to the tournament organizers.\n3. Deliberately abusing an unintended game mechanic may result in a penalty or disqualification.\n4. The organizers will decide how to handle major technical or gameplay issues.',
        order: 8,
        published: true
      },
      {
        category: 'Technical',
        title: '09. Technical & Connectivity Issues',
        content: '1. Every player is responsible for their own mobile phone, battery, internet connection, BGMI installation, and device performance.\n2. Players should ensure their devices are fully charged before every match.\n3. Players should have a stable internet connection before entering the room.\n4. Individual device, battery, network, or connectivity problems will generally not result in a match restart.\n5. If a major server or game-related issue affects multiple teams, the organizers will decide whether the match should be restarted, continued, or otherwise handled.\n6. The organizer\'s decision regarding technical issues will be final.',
        order: 9,
        published: true
      },
      {
        category: 'Administration',
        title: '10. Room Card & Tournament Administration',
        content: '1. The tournament will use Advanced Room Cards for the matches.\n2. Tournament organizers and room administrators will have the authority to manage the room and participating players.\n3. If a player violates tournament rules, the organizers may remove the player from the room.\n4. A player removed or banned for a serious violation may not be permitted to participate in any remaining matches.\n5. Players must cooperate with organizers and room administrators at all times.',
        order: 10,
        published: true
      },
      {
        category: 'Scoring',
        title: '11. Match Results & Scoring',
        content: '1. Match results will be recorded by the tournament organizers.\n2. Players must not interfere with the score-recording process.\n3. Any scoring dispute must be reported to the organizer immediately after the match.\n4. Once the results have been verified and finalized, changes may not be permitted unless an official error is identified.\n5. The final tournament ranking will be determined according to the official scoring system announced by the organizers.',
        order: 11,
        published: true
      },
      {
        category: 'Communication',
        title: '12. Prohibited Communication',
        content: '1. Players must not communicate with active players from another team during an ongoing match.\n2. Eliminated players must not provide information about: enemy locations, rotations, player health, loot, vehicles, zone information, or opponent strategies.\n3. Spectators, eliminated players, and other participants must not interfere with active teams.\n4. Any attempt to provide outside information to an active player may be treated as unfair play.',
        order: 12,
        published: true
      },
      {
        category: 'Disqualification',
        title: '13. Disqualification & Ban Policy',
        content: 'A player or team may be immediately disqualified for:\n• Hacking or cheating\n• Using prohibited devices (tablets, iPads, emulators, laptops)\n• Unauthorized third-party software (scripts, injectors, or modified files)\n• Exploiting serious bugs/glitches\n• Teaming or collusion\n• Using an unregistered player\n• Information sharing after elimination\n• Entering another team\'s slot/bootcamp\n• Deliberately disrupting a team\n• Match manipulation\n• Serious misconduct / abuse\n• Refusing organizer instructions\n\nTHE TOURNAMENT ORGANIZERS RESERVE THE RIGHT TO REMOVE, DISQUALIFY, OR BAN ANY PLAYER OR TEAM THAT VIOLATES THE TOURNAMENT RULES OR GAINS AN UNFAIR ADVANTAGE. A BANNED PLAYER WILL NOT BE ALLOWED TO PARTICIPATE IN ANY REMAINING MATCHES.',
        order: 13,
        published: true
      },
      {
        category: 'Governance',
        title: "14. Organizer's Final Authority",
        content: "1. All participants must follow the instructions of the Tournament Organizers, Referees, Room Administrators, and authorized staff.\n2. The organizers have the authority to take action against rule violations.\n3. In situations not specifically covered by these rules, the organizers will decide the appropriate action.\n4. The decision of the Tournament Organizers regarding rule violations, disputes, technical issues, penalties, disqualifications, and match administration will be final.\n\nPLAY FAIR. PLAY CLEAN. RESPECT THE GAME.\nMobile Only • No Tabs / iPads • No Emulators • No Hacks • No Cheats • No Third-Party Tools • No Teaming • No Slot Intrusion • No Info Sharing After Elimination",
        order: 14,
        published: true
      }
    ];
    await Rule.insertMany(rules);
    console.log('Official rules seeded.');

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
        winnerTeam: 'Axions',
        mvp: { name: 'Kratos', ign: 'AXN-Kratos', team: 'Axions', kills: 7 },
        scores: [
          { rank: 1, team: 'Axions', placementPts: 10, kills: 12, killPts: 12, total: 22 },
          { rank: 2, team: 'GodLike Esports', placementPts: 8, kills: 8, killPts: 8, total: 16 },
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
