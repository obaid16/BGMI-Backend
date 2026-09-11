require('dotenv').config();
const mongoose = require('mongoose');
const Rule = require('../src/models/Rule');

const dbUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bgmi_esports';

const officialRules = [
  {
    category: 'Device & Equipment',
    title: '01. Device & Equipment Rules',
    content: `1. Only mobile phones are allowed for participation in the tournament.
2. Tablets, iPads, emulators, laptops, PCs, or any other devices are strictly prohibited.
3. Every player must use their registered BGMI account throughout the tournament.
4. Players are not allowed to switch accounts or play using another player's account.
5. Players are responsible for ensuring that their device has sufficient battery, storage, internet connection, and the required BGMI version before every match.
6. Players must keep their devices ready before the scheduled match time.`,
    order: 1,
    published: true
  },
  {
    category: 'Fair Play & Anti-Cheat',
    title: '02. Hacking, Cheating & Unfair Play — Zero Tolerance',
    content: `1. The use of hacks, cheats, scripts, injectors, game-file modifications, config modifications, unauthorized applications, or any third-party tools that provide an unfair advantage is strictly prohibited.
2. Any attempt to gain an unfair advantage will be treated as a serious violation.
3. The tournament will use Advanced Room Cards, and the organizers reserve the right to remove or ban a player immediately if cheating, hacking, or suspicious activity is detected.
4. A player found using cheats or hacks may be immediately disqualified from the tournament.
5. A banned player will not be allowed to participate in any remaining matches of the tournament.
6. Depending on the severity of the violation, the entire team may also be disqualified.
7. Claiming that the hack/cheat was accidental, borrowed, or caused by another person will not automatically excuse the violation.

NO HACKS • NO CHEATS • NO THIRD-PARTY TOOLS • PLAY FAIR`,
    order: 2,
    published: true
  },
  {
    category: 'Slot & Bootcamp',
    title: '03. Slot & Bootcamp Allocation',
    content: `1. The organizers will assign every team a specific Slot/Bootcamp Number.
2. Once your respective slot number is announced, your team must stay in its assigned slot.
3. Players are not allowed to move to, sit in, or occupy another team's slot/Bootcamp.
4. Players must not switch slots during a match without permission from the tournament organizers.
5. Players from different teams must not intentionally gather in another team's assigned Bootcamp.
6. If a player needs to leave their assigned slot for any genuine reason, they must first inform the organizer and receive permission.
7. Repeatedly ignoring slot instructions may result in a warning, penalty, or disqualification.

YOUR SLOT IS YOUR TEAM'S DESIGNATED AREA — DO NOT MOVE TO ANOTHER TEAM'S SLOT`,
    order: 3,
    published: true
  },
  {
    category: 'Match & Room',
    title: '04. Match & Room Rules',
    content: `1. Players must join their respective room before the scheduled match start time.
2. Players must join the correct room assigned by the organizers.
3. Room ID and password will be provided by the organizers.
4. Room ID and password must not be shared with non-participating players.
5. Players must follow all instructions given by the room administrators and tournament organizers.
6. Once the match has started, late entry may not be guaranteed.
7. Players must not intentionally disrupt the room or delay the start of a match.
8. Players must remain in their assigned physical slot/Bootcamp during the match unless permission is given by the organizer.`,
    order: 4,
    published: true
  },
  {
    category: 'Elimination Protocol',
    title: '05. After Elimination Protocols',
    content: `1. Once a player or team is eliminated from a match, they must remain in their respective assigned Bootcamp/slot.
2. Eliminated players are not allowed to move to another team's Bootcamp or slot.
3. Eliminated players must wait until the entire match has officially ended.
4. Eliminated players must not provide any information to teams that are still playing.
5. No coaching, enemy-location information, callouts, or strategic information may be given to active players after elimination.
6. Players must not intentionally communicate with active players for the purpose of influencing the ongoing match.
7. Players may leave their assigned Bootcamp only after the match has completely ended and the organizer permits them to do so.

ELIMINATED? STAY IN YOUR BOOTCAMP UNTIL THE MATCH ENDS`,
    order: 5,
    published: true
  },
  {
    category: 'Team & Roster',
    title: '06. Team & Player Rules',
    content: `1. Only registered players are allowed to participate.
2. No unregistered player may play in place of a registered player.
3. Players cannot change teams after the tournament has started.
4. Players must use their registered in-game identity/details.
5. Players must not intentionally help another team.
6. Teaming or collusion between teams is strictly prohibited.
7. Any attempt to manipulate the result of a match may result in immediate disqualification.`,
    order: 6,
    published: true
  },
  {
    category: 'Sportsmanship',
    title: '07. Fair Play & Sportsmanship',
    content: `All players are expected to maintain proper sportsmanship throughout the tournament. The following behaviour is prohibited:
• Abusive or offensive language toward organizers or players
• Threatening behaviour
• Fighting or physical confrontation
• Deliberately disturbing another team
• Intentionally distracting players during a match
• Harassment of other participants
• Disrespectful behaviour toward tournament staff
• Deliberate damage to tournament property or equipment

SERIOUS MISCONDUCT MAY RESULT IN IMMEDIATE REMOVAL FROM THE TOURNAMENT`,
    order: 7,
    published: true
  },
  {
    category: 'Exploits',
    title: '08. Bugs, Glitches & Exploits',
    content: `1. Players are not allowed to intentionally exploit any game bug or glitch to gain an unfair advantage.
2. If a player discovers a serious game-breaking issue, they must report it to the tournament organizers.
3. Deliberately abusing an unintended game mechanic may result in a penalty or disqualification.
4. The organizers will decide how to handle major technical or gameplay issues.`,
    order: 8,
    published: true
  },
  {
    category: 'Technical',
    title: '09. Technical & Connectivity Issues',
    content: `1. Every player is responsible for their own mobile phone, battery, internet connection, BGMI installation, and device performance.
2. Players should ensure their devices are fully charged before every match.
3. Players should have a stable internet connection before entering the room.
4. Individual device, battery, network, or connectivity problems will generally not result in a match restart.
5. If a major server or game-related issue affects multiple teams, the organizers will decide whether the match should be restarted, continued, or otherwise handled.
6. The organizer's decision regarding technical issues will be final.`,
    order: 9,
    published: true
  },
  {
    category: 'Administration',
    title: '10. Room Card & Tournament Administration',
    content: `1. The tournament will use Advanced Room Cards for the matches.
2. Tournament organizers and room administrators will have the authority to manage the room and participating players.
3. If a player violates tournament rules, the organizers may remove the player from the room.
4. A player removed or banned for a serious violation may not be permitted to participate in any remaining matches.
5. Players must cooperate with organizers and room administrators at all times.`,
    order: 10,
    published: true
  },
  {
    category: 'Scoring',
    title: '11. Match Results & Scoring',
    content: `1. Match results will be recorded by the tournament organizers.
2. Players must not interfere with the score-recording process.
3. Any scoring dispute must be reported to the organizer immediately after the match.
4. Once the results have been verified and finalized, changes may not be permitted unless an official error is identified.
5. The final tournament ranking will be determined according to the official scoring system announced by the organizers.`,
    order: 11,
    published: true
  },
  {
    category: 'Communication',
    title: '12. Prohibited Communication',
    content: `1. Players must not communicate with active players from another team during an ongoing match.
2. Eliminated players must not provide information about: enemy locations, rotations, player health, loot, vehicles, zone information, or opponent strategies.
3. Spectators, eliminated players, and other participants must not interfere with active teams.
4. Any attempt to provide outside information to an active player may be treated as unfair play.`,
    order: 12,
    published: true
  },
  {
    category: 'Disqualification',
    title: '13. Disqualification & Ban Policy',
    content: `A player or team may be immediately disqualified for:
• Hacking or cheating
• Using prohibited devices (tablets, iPads, emulators, laptops)
• Unauthorized third-party software (scripts, injectors, or modified files)
• Exploiting serious bugs/glitches
• Teaming or collusion
• Using an unregistered player
• Information sharing after elimination
• Entering another team's slot/bootcamp
• Deliberately disrupting a team
• Match manipulation
• Serious misconduct / abuse
• Refusing organizer instructions

THE TOURNAMENT ORGANIZERS RESERVE THE RIGHT TO REMOVE, DISQUALIFY, OR BAN ANY PLAYER OR TEAM THAT VIOLATES THE TOURNAMENT RULES OR GAINS AN UNFAIR ADVANTAGE. A BANNED PLAYER WILL NOT BE ALLOWED TO PARTICIPATE IN ANY REMAINING MATCHES.`,
    order: 13,
    published: true
  },
  {
    category: 'Governance',
    title: "14. Organizer's Final Authority",
    content: `1. All participants must follow the instructions of the Tournament Organizers, Referees, Room Administrators, and authorized staff.
2. The organizers have the authority to take action against rule violations.
3. In situations not specifically covered by these rules, the organizers will decide the appropriate action.
4. The decision of the Tournament Organizers regarding rule violations, disputes, technical issues, penalties, disqualifications, and match administration will be final.

PLAY FAIR. PLAY CLEAN. RESPECT THE GAME.
Mobile Only • No Tabs / iPads • No Emulators • No Hacks • No Cheats • No Third-Party Tools • No Teaming • No Slot Intrusion • No Info Sharing After Elimination`,
    order: 14,
    published: true
  }
];

async function updateRules() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(dbUri);
    console.log('Connected.');

    console.log('Clearing old rules...');
    const deleteResult = await Rule.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} old rules.`);

    console.log('Inserting 14 official rules from PDF...');
    const inserted = await Rule.insertMany(officialRules);
    console.log(`Successfully inserted ${inserted.length} official rules.`);

    console.log('Rules update completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error updating rules:', err);
    process.exit(1);
  }
}

updateRules();
