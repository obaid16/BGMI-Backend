const Team = require('../models/Team');

/**
 * Generates the next sequential registration ID in the format BGMI-2026-XXX
 * @returns {Promise<string>}
 */
async function generateRegistrationId() {
  const lastTeam = await Team.findOne({ registrationId: /^BGMI-2026-\d{3}$/ })
    .sort({ registrationId: -1 })
    .exec();

  let nextNum = 1;
  if (lastTeam && lastTeam.registrationId) {
    const parts = lastTeam.registrationId.split('-');
    const lastNum = parseInt(parts[2], 10);
    if (!isNaN(lastNum)) {
      nextNum = lastNum + 1;
    }
  }

  return `BGMI-2026-${nextNum.toString().padStart(3, '0')}`;
}

module.exports = generateRegistrationId;
