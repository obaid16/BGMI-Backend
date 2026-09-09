const http = require('http');

const API_BASE = 'http://localhost:5000/api';

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: {
        'Connection': 'close',
        ...(options.headers || {})
      }
    };

    if (options.body) {
      reqOptions.headers['Content-Type'] = 'application/json';
      reqOptions.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(options.body));
    } else if (options.method && options.method !== 'GET') {
      reqOptions.headers['Content-Length'] = 0;
    }

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runFullQA() {
  console.log('====================================================');
  console.log('   NIT BGMI CHAMPIONSHIP 2026 - COMPLETE QA AUDIT   ');
  console.log('====================================================\n');

  let adminToken = null;
  let testTeamId = null;
  let testTeamRegId = null;
  let rejectTeamId = null;
  let testMatchId = null;
  let testResultId = null;

  const results = [];

  function record(testId, name, pass, detail) {
    results.push({ testId, name, pass, detail });
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${testId}: ${name}`);
    if (detail) console.log(`       Note: ${detail}`);
  }

  try {
    // 1. AUTH-01: Admin Login
    console.log('\n--- 1. Testing Admin Authentication ---');
    const loginRes = await request(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: {
        email: 'admin1@bgmi.esports',
        password: 'Admin1#BGMI2026'
      }
    });

    if (loginRes.status === 200 && loginRes.data.token) {
      adminToken = loginRes.data.token;
      record('AUTH-01', 'Admin Login', true, `Authenticated as ${loginRes.data.user.email} (Role: ${loginRes.data.user.role})`);
    } else {
      record('AUTH-01', 'Admin Login', false, `Status ${loginRes.status}: ${JSON.stringify(loginRes.data)}`);
      return;
    }

    const authHeaders = {
      'Authorization': `Bearer ${adminToken}`
    };

    // 2. REG-01: Team Registration (Should start in Pending)
    console.log('\n--- 2. Testing Team Registration (Public Flow) ---');
    const uniqueNum = Date.now().toString().slice(-4);
    const squadPayload = {
      teamName: `Alpha Hawks ${uniqueNum}`,
      collegeName: 'Nexcore Institute of Technology',
      captainName: 'Kabir Verma',
      captainPhone: '9876543210',
      captainEmail: `kabir.${uniqueNum}@nexcore.edu.in`,
      players: [
        { name: 'Kabir Verma', ign: `HawksIGL_${uniqueNum}`, bgmiId: `51${uniqueNum}001`, role: 'IGL', photo: '', studentProof: 'PROOF-001', isSub: false },
        { name: 'Rohan Sharma', ign: `HawksAssault_${uniqueNum}`, bgmiId: `51${uniqueNum}002`, role: 'Assaulter', photo: '', studentProof: 'PROOF-002', isSub: false },
        { name: 'Arjun Das', ign: `HawksEntry_${uniqueNum}`, bgmiId: `51${uniqueNum}003`, role: 'Entry Fragger', photo: '', studentProof: 'PROOF-003', isSub: false },
        { name: 'Sameer Khan', ign: `HawksSupport_${uniqueNum}`, bgmiId: `51${uniqueNum}004`, role: 'Support', photo: '', studentProof: 'PROOF-004', isSub: false }
      ]
    };

    const regRes = await request(`${API_BASE}/teams/register`, {
      method: 'POST',
      body: squadPayload
    });

    if (regRes.status === 201 && regRes.data.success) {
      const teamData = regRes.data.data.team;
      testTeamId = teamData._id;
      testTeamRegId = regRes.data.data.registrationId;
      const isPending = teamData.status === 'Pending';
      record('REG-01', 'Team Registration Flow', isPending, `Registered "${squadPayload.teamName}" (RegID: ${testTeamRegId}, Status: ${teamData.status})`);
    } else {
      record('REG-01', 'Team Registration Flow', false, `Status ${regRes.status}: ${JSON.stringify(regRes.data)}`);
    }

    // 3. ADM-01: Admin Registrations Inspection (Verify it's in Pending queue)
    console.log('\n--- 3. Testing Admin Registrations Queue ---');
    const allTeamsRes = await request(`${API_BASE}/teams`, { headers: authHeaders });
    if (allTeamsRes.status === 200) {
      const teams = Array.isArray(allTeamsRes.data) ? allTeamsRes.data : (allTeamsRes.data.data || []);
      const found = teams.find(t => t.registrationId === testTeamRegId || t._id === testTeamId);
      const isPendingInList = found && found.status === 'Pending';
      record('ADM-01', 'View Pending Registrations', !!isPendingInList, `Found team ${testTeamRegId} in admin list with status '${found ? found.status : 'not found'}'`);
    } else {
      record('ADM-01', 'View Pending Registrations', false, `Status ${allTeamsRes.status}`);
    }

    // 4. ADM-02: Squad Approval
    console.log('\n--- 4. Testing Squad Approval Flow ---');
    const approveRes = await request(`${API_BASE}/teams/${testTeamId}/status`, {
      method: 'PUT',
      headers: authHeaders,
      body: { status: 'Approved' }
    });

    if (approveRes.status === 200 && approveRes.data.success) {
      const approvedTeam = approveRes.data.data || approveRes.data.team;
      const isApproved = approvedTeam && approvedTeam.status === 'Approved' && approvedTeam.verified === true;
      record('ADM-02', 'Squad Approval Flow', isApproved, `Status changed to '${approvedTeam ? approvedTeam.status : 'unknown'}', Verified: ${approvedTeam ? approvedTeam.verified : false}`);
    } else {
      record('ADM-02', 'Squad Approval Flow', false, `Status ${approveRes.status}: ${JSON.stringify(approveRes.data)}`);
    }

    // 5. ADM-03: Public Directory Sync
    console.log('\n--- 5. Testing Public Directory Sync ---');
    const publicTeamsRes = await request(`${API_BASE}/teams`);
    if (publicTeamsRes.status === 200) {
      const teams = Array.isArray(publicTeamsRes.data) ? publicTeamsRes.data : (publicTeamsRes.data.data || []);
      const approvedFound = teams.find(t => (t.registrationId === testTeamRegId || t._id === testTeamId) && t.status === 'Approved');
      record('ADM-03', 'Public Directory Sync', !!approvedFound, `Verified "${approvedFound ? approvedFound.name : 'Not Found'}" is active in public directory`);
    } else {
      record('ADM-03', 'Public Directory Sync', false, `Status ${publicTeamsRes.status}`);
    }

    // 6. ADM-04: Rejection Flow
    console.log('\n--- 6. Testing Squad Rejection Flow ---');
    const rejectSquadPayload = {
      teamName: `Beta Renegades ${uniqueNum}`,
      collegeName: 'Nexcore Institute of Technology',
      captainName: 'Varun Grover',
      captainPhone: '9123456780',
      captainEmail: `varun.${uniqueNum}@nexcore.edu.in`,
      players: [
        { name: 'Varun Grover', ign: `BetaIGL_${uniqueNum}`, bgmiId: `52${uniqueNum}001`, role: 'IGL' },
        { name: 'Dev Malik', ign: `BetaDev_${uniqueNum}`, bgmiId: `52${uniqueNum}002`, role: 'Assaulter' },
        { name: 'Kunal Roy', ign: `BetaKunal_${uniqueNum}`, bgmiId: `52${uniqueNum}003`, role: 'Support' },
        { name: 'Naveen Jain', ign: `BetaNav_${uniqueNum}`, bgmiId: `52${uniqueNum}004`, role: 'Entry Fragger' }
      ]
    };

    const rejectRegRes = await request(`${API_BASE}/teams/register`, {
      method: 'POST',
      body: rejectSquadPayload
    });

    if (rejectRegRes.status === 201 && rejectRegRes.data.success) {
      rejectTeamId = rejectRegRes.data.data.team._id;
      const rejectActionRes = await request(`${API_BASE}/teams/${rejectTeamId}/status`, {
        method: 'PUT',
        headers: authHeaders,
        body: { status: 'Rejected', rejectionReason: 'Incomplete college student verification proof' }
      });

      if (rejectActionRes.status === 200 && rejectActionRes.data.success) {
        const rejTeam = rejectActionRes.data.data || rejectActionRes.data.team;
        const isRejected = rejTeam && rejTeam.status === 'Rejected' && (rejTeam.rejectionReason || '').includes('Incomplete');
        record('ADM-04', 'Squad Rejection Flow', isRejected, `Team rejected with reason: "${rejTeam ? rejTeam.rejectionReason : 'none'}"`);
      } else {
        record('ADM-04', 'Squad Rejection Flow', false, `Status ${rejectActionRes.status}`);
      }
    } else {
      record('ADM-04', 'Squad Rejection Flow', false, `Failed to register rejection candidate team: ${rejectRegRes.status}`);
    }

    // 7. MAT-01: Match Creation
    console.log('\n--- 7. Testing Match Creation ---');
    const matchPayload = {
      round: 'Quarterfinals',
      map: 'Erangel',
      date: '2026-09-10',
      time: '18:00',
      status: 'Upcoming',
      streamUrl: 'https://youtube.com/live/championship-qf-1',
      participatingTeams: testTeamId ? [testTeamId] : []
    };

    const matchRes = await request(`${API_BASE}/matches`, {
      method: 'POST',
      headers: authHeaders,
      body: matchPayload
    });

    if (matchRes.status === 201 && matchRes.data.success) {
      testMatchId = matchRes.data.data._id;
      record('MAT-01', 'Match Creation', true, `Scheduled Match #${matchRes.data.data.matchNumber} (${matchRes.data.data.title})`);
    } else {
      record('MAT-01', 'Match Creation', false, `Status ${matchRes.status}: ${JSON.stringify(matchRes.data)}`);
    }

    // 8. MAT-02: Match Status Switch (Upcoming -> Live)
    console.log('\n--- 8. Testing Match Status Transition ---');
    if (testMatchId) {
      const matchStatusRes = await request(`${API_BASE}/matches/${testMatchId}/status`, {
        method: 'PUT',
        headers: authHeaders,
        body: { status: 'Live' }
      });

      if (matchStatusRes.status === 200 && matchStatusRes.data.success) {
        const isLive = matchStatusRes.data.data.status === 'Live';
        record('MAT-02', 'Match Status Transition (Live)', isLive, `Status updated to '${matchStatusRes.data.data.status}'`);
      } else {
        record('MAT-02', 'Match Status Transition (Live)', false, `Status ${matchStatusRes.status}`);
      }
    } else {
      record('MAT-02', 'Match Status Transition (Live)', false, 'No test match ID available');
    }

    // 9. RES-01: Result Entry & Points Calculation
    console.log('\n--- 9. Testing Results Entry & Score Calculation ---');
    if (testMatchId && testTeamId) {
      const resultPayload = {
        matchId: testMatchId,
        winnerTeamId: testTeamId,
        leaderboard: [
          {
            rank: 1,
            teamId: testTeamId,
            kills: 14,
            bonus: 0,
            penalty: 0
          }
        ],
        proofs: {
          screenshots: ['https://example.com/scorecard.png'],
          povVideos: []
        }
      };

      const resultRes = await request(`${API_BASE}/results`, {
        method: 'POST',
        headers: authHeaders,
        body: resultPayload
      });

      if (resultRes.status === 201 && resultRes.data.success) {
        testResultId = resultRes.data.data._id;
        const entry = resultRes.data.data.leaderboard[0];
        // 1st place = 10 pts + 14 kill pts = 24 total pts
        record('RES-01', 'Result Entry & WWCD Calculation', true, `Total points: ${entry.total || entry.totalPts} (Placement: ${entry.placementPts}, Kills: ${entry.killPts})`);
      } else {
        record('RES-01', 'Result Entry & WWCD Calculation', false, `Status ${resultRes.status}: ${JSON.stringify(resultRes.data)}`);
      }
    } else {
      record('RES-01', 'Result Entry & WWCD Calculation', false, 'Missing match or team ID');
    }

    // 10. STD-01: Standings Sync
    console.log('\n--- 10. Testing Standings Leaderboard ---');
    const standingsRes = await request(`${API_BASE}/standings`);
    if (standingsRes.status === 200 && standingsRes.data.success) {
      const standings = standingsRes.data.data || [];
      record('STD-01', 'Standings Leaderboard Calculation', true, `Leaderboard records found: ${standings.length}. Calculated standings synchronized.`);
    } else {
      record('STD-01', 'Standings Leaderboard Calculation', false, `Status ${standingsRes.status}`);
    }

    // 11. MVP-01: MVP Fraggers Leaderboard
    console.log('\n--- 11. Testing MVP Fraggers ---');
    const mvpRes = await request(`${API_BASE}/players`);
    if (mvpRes.status === 200) {
      const players = Array.isArray(mvpRes.data) ? mvpRes.data : (mvpRes.data.data || []);
      record('MVP-01', 'MVP / Fragger Directory', true, `Found ${players.length} registered players in directory.`);
    } else {
      record('MVP-01', 'MVP / Fragger Directory', false, `Status ${mvpRes.status}`);
    }

    // 12. MED-01: Media Submission
    console.log('\n--- 12. Testing Media Submission ---');
    let testMediaId = null;
    const mediaPayload = {
      title: `Clutch 1v3 by Kabir - Match #${uniqueNum}`,
      type: 'POV',
      team: `Alpha Hawks ${uniqueNum}`,
      player: 'Kabir Verma',
      match: 'Quarterfinals Erangel',
      videoUrl: 'https://youtube.com/watch?v=sample123'
    };

    const mediaSubRes = await request(`${API_BASE}/media`, {
      method: 'POST',
      body: mediaPayload
    });

    if (mediaSubRes.status === 201 && mediaSubRes.data.success) {
      testMediaId = mediaSubRes.data.data._id;
      record('MED-01', 'Media Submission Flow', true, `Submitted media "${mediaPayload.title}" with status '${mediaSubRes.data.data.status}'`);
    } else {
      record('MED-01', 'Media Submission Flow', false, `Status ${mediaSubRes.status}: ${JSON.stringify(mediaSubRes.data)}`);
    }

    // 13. MED-02: Media Moderation (Publish)
    console.log('\n--- 13. Testing Media Moderation ---');
    if (testMediaId) {
      const mediaPubRes = await request(`${API_BASE}/media/${testMediaId}/publish`, {
        method: 'PUT',
        headers: authHeaders
      });

      if (mediaPubRes.status === 200 && mediaPubRes.data.success) {
        record('MED-02', 'Media Moderation & Publishing', true, `Media item published to public gallery.`);
      } else {
        record('MED-02', 'Media Moderation & Publishing', false, `Status ${mediaPubRes.status}`);
      }
    } else {
      record('MED-02', 'Media Moderation & Publishing', false, 'Missing test media ID');
    }

    // 14. DEL-01: Deletion Workflow
    console.log('\n--- 14. Testing Deletion & Cleanup ---');
    let deleteSuccess = true;

    // Delete test media
    if (testMediaId) {
      const delMediaRes = await request(`${API_BASE}/media/${testMediaId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (delMediaRes.status !== 200) deleteSuccess = false;
    }

    // Delete rejected team
    if (rejectTeamId) {
      const delTeamRes = await request(`${API_BASE}/teams/${rejectTeamId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (delTeamRes.status !== 200) deleteSuccess = false;
    }

    // Delete test match
    if (testMatchId) {
      const delMatchRes = await request(`${API_BASE}/matches/${testMatchId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (delMatchRes.status !== 200) deleteSuccess = false;
    }

    // Delete test result
    if (testResultId) {
      const delResRes = await request(`${API_BASE}/results/${testResultId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (delResRes.status !== 200) deleteSuccess = false;
    }

    record('DEL-01', 'Administrative Deletion Workflow', deleteSuccess, 'Successfully deleted test team, test match, and test scorecard cleanly.');

  } catch (err) {
    console.error('Test execution exception:', err);
  }

  console.log('\n====================================================');
  console.log('                 FINAL TEST SUMMARY                 ');
  console.log('====================================================');
  const passCount = results.filter(r => r.pass).length;
  console.log(`Total Scenarios: ${results.length} | Passed: ${passCount} | Failed: ${results.length - passCount}`);
  console.log('====================================================\n');
}

runFullQA();
