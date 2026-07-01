// seed/seedStaff.js
// Creates lecturers (one adviser per level per department) + one admin.
// Reuses the same email + password approach as the student seed.

require('dotenv').config();
const dns = require('dns');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

dns.setServers(['8.8.8.8', '1.1.1.1']);

const DEFAULT_PASSWORD = 'password';

// code = the 2-letter prefix used in the staff ID (CS300, MT300, PH300).
const DEPARTMENTS = [
  { name: 'Computer Science', code: 'CS' },
  { name: 'Mathematics', code: 'MT' },
  { name: 'Physics', code: 'PH' },
];

const LEVELS = [100, 200, 300, 400, 500];

const FIRST_NAMES = [
  'Grace',
  'Daniel',
  'Esther',
  'Samuel',
  'Ruth',
  'Joseph',
  'Miriam',
  'Paul',
  'Deborah',
  'Peter',
  'Lydia',
  'Stephen',
  'Rebecca',
  'Andrew',
  'Naomi',
];
const LAST_NAMES = [
  'Okoro',
  'Adeleke',
  'Nwankwo',
  'Bello',
  'Eze',
  'Ogunbanjo',
  'Chukwu',
  'Sanni',
  'Umeh',
  'Balogun',
  'Nnaji',
  'Yusuf',
  'Okeke',
  'Lawal',
  'Igwe',
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// "Grace Okoro" -> "g.okoro"
const usernameFromName = (fullName) => {
  const parts = fullName.trim().split(/\s+/);
  return `${parts[0][0].toLowerCase()}.${parts[parts.length - 1].toLowerCase()}`;
};

// Build a unique email, appending a number on collision (g.okoro1, g.okoro2...).
const buildUniqueEmail = (fullName, domain, usedEmails) => {
  const base = usernameFromName(fullName);
  let candidate = `${base}@${domain}`;
  let counter = 1;
  while (usedEmails.has(candidate)) {
    candidate = `${base}${counter}@${domain}`;
    counter++;
  }
  usedEmails.add(candidate);
  return candidate;
};

const seedStaff = async () => {
  try {
    await connectDB();

    // Clear ONLY lecturers and admins — students stay untouched.
    const deleted = await User.deleteMany({ role: { $in: ['lecturer', 'admin'] } });
    console.log(`🧹 Cleared ${deleted.deletedCount} staff account(s)`);

    const usedEmails = new Set();
    const staffToCreate = [];

    // --- Lecturers: one adviser per level, per department ---
    DEPARTMENTS.forEach((dept) => {
      LEVELS.forEach((level) => {
        const fullName = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
        const email = buildUniqueEmail(fullName, 'lec.unizik.edu.ng', usedEmails);
        // Staff ID pattern: <deptcode><level>  ->  CS300, MT100, PH500
        const staffId = `${dept.code}${level}`;

        staffToCreate.push({
          name: fullName,
          role: 'lecturer',
          staffId,
          email,
          password: DEFAULT_PASSWORD, // model hashes this on save
          department: dept.name,
          level, // the level this lecturer advises
        });
      });
    });

    // --- One admin ---
    const adminName = 'System Administrator';
    const adminEmail = buildUniqueEmail(adminName, 'admin.unizik.edu.ng', usedEmails);
    staffToCreate.push({
      name: adminName,
      role: 'admin',
      email: adminEmail,
      password: DEFAULT_PASSWORD,
      // no department/level — the admin oversees everything
    });

    // create() (NOT insertMany) so the password-hashing hook runs on each.
    const created = await User.create(staffToCreate);
    console.log(`✅ Created ${created.length} staff accounts\n`);

    created.forEach((u) => {
      const login = u.staffId || u.email; // lecturers show staffId, admin shows email
      console.log(
        `   • ${u.role.padEnd(9)} ${login.padEnd(24)} ${u.department || 'all departments'}`,
      );
    });

    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error(`❌ Staff seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seedStaff();
