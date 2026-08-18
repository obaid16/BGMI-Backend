require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const jwt = require('jsonwebtoken');

async function testAdminApproval() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  let admin = await User.findOne({});
  if (!admin) {
    admin = await User.create({
      name: 'System Admin',
      email: 'admin@bgmi.com',
      password: 'password123',
      role: 'SUPER_ADMIN'
    });
  } else if (admin.role !== 'SUPER_ADMIN' && admin.role !== 'ADMIN') {
    admin.role = 'SUPER_ADMIN';
    await admin.save();
  }

  const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET || 'supersecretbgmiesportssecretkey123!', { expiresIn: '1h' });

  console.log('Sending PUT approval for team BGMI-2026-016 with Admin Token...');

  const res = await fetch('http://localhost:5000/api/teams/BGMI-2026-016/status', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ status: 'Approved' })
  });

  const data = await res.json();
  console.log('REAL ADMIN APPROVAL RESPONSE:', data);
  process.exit(0);
}

testAdminApproval();
