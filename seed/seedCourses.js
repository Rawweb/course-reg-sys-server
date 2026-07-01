// seed/seedCourses.js
// Loads all courses into MongoDB using a safe "clear-then-insert" pattern,
// so re-running it never creates duplicates.

require('dotenv').config(); 
const dns = require('dns');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Course = require('../models/Course');
const allCourses = require('./allCourses'); 

dns.setServers(['8.8.8.8', '1.1.1.1']);

const seedCourses = async () => {
  try {
    await connectDB();
    const deleted = await Course.deleteMany({});
    console.log(`🧹 Cleared ${deleted.deletedCount} existing course(s)`);

    const inserted = await Course.insertMany(allCourses);
    console.log(`✅ Inserted ${inserted.length} course(s)`);

    const departments = ['Computer Science', 'Mathematics', 'Physics'];
    departments.forEach((dept) => {
      const count = allCourses.filter((c) => c.department === dept).length;
      console.log(`   • ${dept}: ${count} courses`);
    });

    console.log('\n🔎 Checking semester unit totals (min 15, 400L exempt):');
    departments.forEach((dept) => {
      [100, 200, 300, 400, 500].forEach((level) => {
        [1, 2].forEach((semester) => {
          const total = allCourses
            .filter((c) => c.department === dept && c.level === level && c.semester === semester)
            .reduce((sum, c) => sum + c.unit, 0);

          if (level !== 400 && total < 15) {
            console.log(`   ⚠️  ${dept} ${level}L sem${semester} = ${total} units (BELOW 15)`);
          }
        });
      });
    });
    console.log('   (no ⚠️ above means every required semester is fine)\n');

    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error(`❌ Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seedCourses();
