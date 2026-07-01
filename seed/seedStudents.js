require('dotenv').config();
const dns = require('dns');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const AcademicRecord = require('../models/AcademicRecord');
const allCourses = require('./allCourses');

dns.setServers(['8.8.8.8', '1.1.1.1']);

const CURRENT_SESSION_START = 2025;

const DEFAULT_PASSWORD = 'password';

const DEPARTMENTS = [
  { name: 'Computer Science', code: '513' },
  { name: 'Mathematics', code: '512' },
  { name: 'Physics', code: '514' },
];

const LEVEL_COUNTS = {
  100: 40,
  200: 34,
  300: 30,
  400: 25,
  500: 21,
};

const CARRYOVER_RATE = 0.2; // 20%

const FIRST_NAMES = [
  'Chidi',
  'Amara',
  'Emeka',
  'Ngozi',
  'Tunde',
  'Bola',
  'Ifeoma',
  'Yusuf',
  'Zainab',
  'Obi',
  'Funke',
  'Musa',
  'Adaeze',
  'Segun',
  'Halima',
  'Kelechi',
  'Damilola',
  'Uche',
  'Sade',
  'Ibrahim',
  'Chinelo',
  'Bassey',
  'Nneka',
  'Suleiman',
  'Chiamaka',
  'Kunle',
  'Fatima',
  'Ebuka',
  'Aisha',
  'Nonso',
  'Temitope',
  'Ikenna',
  'Blessing',
  'Abubakar',
  'Chisom',
  'Wale',
  'Amaka',
  'Danjuma',
  'Oluwaseun',
  'Somto',
  'Rukayat',
  'Chibuzo',
  'Folake',
  'Emmanuel',
  'Nkechi',
  'Bright',
  'Hauwa',
  'Ifeanyi',
  'Tochukwu',
  'Gloria',
  'Abdullahi',
  'Chinonso',
  'Yetunde',
  'Kingsley',
  'Maryam',
  'Obinna',
  'Peace',
  'Sani',
  'Adanna',
  'Victor',
  'Oyinkansola',
  'Uchenna',
  'Fadekemi',
  'Godwin',
  'Chidera',
  'Rahmat',
  'Ezinne',
  'Solomon',
  'Aminat',
  'Chukwuemeka',
];

const LAST_NAMES = [
  'Chife',
  'Okafor',
  'Adeyemi',
  'Eze',
  'Bello',
  'Nwosu',
  'Okeke',
  'Lawal',
  'Mohammed',
  'Chukwu',
  'Balogun',
  'Obi',
  'Yakubu',
  'Anyanwu',
  'Ogunleye',
  'Suleiman',
  'Igwe',
  'Ojo',
  'Nnamdi',
  'Aliyu',
  'Onyeka',
  'Adebayo',
  'Okonkwo',
  'Ibrahim',
  'Afolabi',
  'Nwachukwu',
  'Sanusi',
  'Okoro',
  'Adewale',
  'Uzoma',
  'Bakare',
  'Ekwueme',
  'Danladi',
  'Olawale',
  'Nwankwo',
  'Usman',
  'Oladipo',
  'Chukwuma',
  'Abdullahi',
  'Ogbonna',
  'Fashola',
  'Emeka',
  'Garba',
  'Nwafor',
  'Oyelaran',
  'Madueke',
  'Shehu',
  'Onyekwere',
  'Ajayi',
  'Ugochukwu',
  'Aminu',
  'Oduya',
  'Chikelu',
  'Babatunde',
  'Idris',
  'Okafor',
  'Ekene',
  'Musa',
  'Adeleke',
  'Nwabueze',
  'Bature',
  'Olamide',
  'Chukwuebuka',
  'Ogunyemi',
  'Haruna',
  'Nwoke',
  'Salami',
  'Ezeh',
  'Akande',
  'Umeh',
  'Dauda',
];

// Pick a random item from an array.
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const levelFromEntryYear = (entryYear) => (CURRENT_SESSION_START - entryYear + 1) * 100;

// Build the "base" username from a full name.
// "Kingsley Chife" -> "k.chife"   (first initial + "." + last name)
const usernameFromName = (fullName) => {
  const parts = fullName.trim().split(/\s+/); // split on any whitespace
  const firstInitial = parts[0][0].toLowerCase(); // "K" -> "k"
  const lastName = parts[parts.length - 1].toLowerCase(); // "Chife" -> "chife"
  return `${firstInitial}.${lastName}`;
};

// Make a unique email for a given username base + domain.
// We pass in a Set of already-used emails; if the email is taken, we append
// a number (k.chife -> k.chife1 -> k.chife2) until we find a free one.
const buildUniqueEmail = (fullName, domain, usedEmails) => {
  const base = usernameFromName(fullName);
  let candidate = `${base}@${domain}`;
  let counter = 1;

  // Keep bumping the number until the email isn't already used.
  while (usedEmails.has(candidate)) {
    candidate = `${base}${counter}@${domain}`;
    counter++;
  }
  usedEmails.add(candidate);
  return candidate;
};

// Build the session string for a course taken at a given level.
// e.g. entry 2021, level 300 -> yearIndex 2 -> 2023 -> "2023/2024".
const sessionForLevel = (entryYear, level) => {
  const yearIndex = level / 100 - 1;
  const startYear = entryYear + yearIndex;
  return `${startYear}/${startYear + 1}`;
};

// Get all courses for a department + level (+ optional semester).
const coursesFor = (department, level, semester = null) =>
  allCourses.filter(
    (c) =>
      c.department === department &&
      c.level === level &&
      (semester === null || c.semester === semester),
  );

// A random PASSING grade, weighted to look realistic. Never returns F here —
// failures are injected deliberately and carefully later.
const randomPassGrade = () => {
  const r = Math.random();
  if (r < 0.15) return 'A';
  if (r < 0.45) return 'B';
  if (r < 0.75) return 'C';
  if (r < 0.9) return 'D';
  return 'E';
};

const seedStudents = async () => {
  try {
    await connectDB();

    const usedEmails = new Set();
    const deletedRecords = await AcademicRecord.deleteMany({});
    const deletedStudents = await User.deleteMany({ role: 'student' });
    console.log(
      `🧹 Cleared ${deletedStudents.deletedCount} students, ${deletedRecords.deletedCount} records`,
    );

    const studentsToCreate = [];

    DEPARTMENTS.forEach((dept) => {
      Object.keys(LEVEL_COUNTS).forEach((levelStr) => {
        const level = Number(levelStr);
        const count = LEVEL_COUNTS[level];
        const entryYear = CURRENT_SESSION_START - (level / 100 - 1);

        for (let serial = 1; serial <= count; serial++) {
          // Pad the serial to 3 digits: 1 -> "001", 27 -> "027".
          const serialStr = String(serial).padStart(3, '0');
          const matricNumber = `${entryYear}${dept.code}${serialStr}`;

          // Build the name first so we can derive the email from it.
          const fullName = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
          const email = buildUniqueEmail(fullName, 'stu.unizik.edu.ng', usedEmails);

          studentsToCreate.push({
            name: fullName,
            role: 'student',
            matricNumber,
            email,
            password: DEFAULT_PASSWORD,
            department: dept.name,
            level,
            entryYear,
          });
        }
      });
    });

    const createdStudents = await User.create(studentsToCreate);
    console.log(`✅ Created ${createdStudents.length} students`);

    // 4. BUILD ACADEMIC HISTORIES for every student.
    const recordsToCreate = [];

    createdStudents.forEach((student) => {
      const currentLevel = student.level;
      const dept = student.department;

      const prereqMap = {};
      allCourses
        .filter((c) => c.department === dept)
        .forEach((c) => {
          prereqMap[c.courseCode] = c.prerequisites;
        });

      // History = every course from levels STRICTLY BELOW current level.
      // A 300L student has completed 100L and 200L; their 300L is "in progress".
      const studentHistory = [];
      for (let lvl = 100; lvl < currentLevel; lvl += 100) {
        [1, 2].forEach((sem) => {
          coursesFor(dept, lvl, sem).forEach((course) => {
            studentHistory.push({
              student: student._id,
              courseCode: course.courseCode,
              grade: randomPassGrade(),
              session: sessionForLevel(student.entryYear, lvl),
              level: lvl,
              semester: sem,
            });
          });
        });
      }

      const eligibleForCarryover = studentHistory.length > 0 && Math.random() < CARRYOVER_RATE;

      if (eligibleForCarryover) {
        // (a) Which courses gate the CURRENT level? Collect their prereq codes.
        const currentLevelCourses = coursesFor(dept, currentLevel);
        const gatewayCodes = new Set();
        currentLevelCourses.forEach((c) => c.prerequisites.forEach((p) => gatewayCodes.add(p)));

        // (b) Candidates = history courses that are gateways to the current
        //     level AND are NOT a prerequisite for anything already passed.
        //     That second condition is what prevents impossible data.
        const candidates = studentHistory.filter((record) => {
          const code = record.courseCode;
          if (!gatewayCodes.has(code)) return false; // must gate current level

          // Does any OTHER history course depend on this one? If so, failing
          // it would contradict that passed course — so it's unsafe.
          const gatesAPassedCourse = studentHistory.some(
            (other) =>
              other.courseCode !== code && (prereqMap[other.courseCode] || []).includes(code),
          );
          return !gatesAPassedCourse;
        });

        // (c) If we found a safe gateway, fail exactly one. Otherwise leave
        //     this student with a clean all-pass history (no forced contradiction).
        if (candidates.length > 0) {
          const victim = pick(candidates);
          victim.grade = 'F';
        }
      }

      recordsToCreate.push(...studentHistory);
    });

    const createdRecords = await AcademicRecord.insertMany(recordsToCreate);
    console.log(`✅ Created ${createdRecords.length} academic records`);

    // 7. A small report so you can SEE it worked.
    const carryoverCount = createdRecords.filter((r) => r.grade === 'F').length;
    console.log(`   • Students with a carryover create ~${carryoverCount} F grades total`);
    DEPARTMENTS.forEach((d) => {
      const n = createdStudents.filter((s) => s.department === d.name).length;
      console.log(`   • ${d.name}: ${n} students`);
    });

    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error(`❌ Student seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seedStudents();
