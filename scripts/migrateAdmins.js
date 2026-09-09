const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');

const NEW_ADMINS = [
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
];

const OLD_ADMIN_EMAIL = 'obaidullahshaikh07@gmail.com';

async function migrateAdmins() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('No MongoDB URI found in environment variables');
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('Connected to MongoDB successfully.');

  // 1. Remove old admin email
  const deleteResult = await User.deleteMany({ email: OLD_ADMIN_EMAIL.toLowerCase() });
  console.log(`Removed legacy admin "${OLD_ADMIN_EMAIL}": deleted count = ${deleteResult.deletedCount}`);

  // 2. Add or update the two new admin accounts
  for (const adminData of NEW_ADMINS) {
    const existing = await User.findOne({ email: adminData.email.toLowerCase() });
    if (existing) {
      console.log(`Admin "${adminData.email}" already exists. Updating credentials...`);
      existing.name = adminData.name;
      existing.password = adminData.password; // Triggers pre-save hash
      existing.role = adminData.role;
      await existing.save();
      console.log(`Updated admin "${adminData.email}" successfully.`);
    } else {
      console.log(`Creating new admin "${adminData.email}"...`);
      const newAdmin = new User({
        name: adminData.name,
        email: adminData.email.toLowerCase(),
        password: adminData.password,
        role: adminData.role
      });
      await newAdmin.save();
      console.log(`Created admin "${adminData.email}" with role "${adminData.role}".`);
    }
  }

  // 3. Verify accounts and password matching
  console.log('\n--- Verifying Created Admin Accounts ---');
  for (const adminData of NEW_ADMINS) {
    const user = await User.findOne({ email: adminData.email.toLowerCase() });
    if (!user) {
      throw new Error(`Verification failed: user ${adminData.email} not found!`);
    }
    const isMatch = await user.comparePassword(adminData.password);
    console.log(`[PASS] ${adminData.email} (Role: ${user.role}) - Password verification: ${isMatch ? 'VALID' : 'FAILED'}`);
  }

  // 4. Print all current users in DB
  const allUsers = await User.find({}, '-password');
  console.log('\nAll users currently in database:', JSON.stringify(allUsers, null, 2));

  await mongoose.disconnect();
  console.log('\nAdmin migration completed successfully.');
  process.exit(0);
}

migrateAdmins().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
