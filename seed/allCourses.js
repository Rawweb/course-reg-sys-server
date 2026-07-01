const computerScienceCourses = require('./courses.cs');
const mathematicsCourses = require('./courses.maths');
const physicsCourses = require('./courses.physics');

// The "..." is the spread operator. It takes every item OUT of each array
// and drops them into this new combined array, one after another.
// Result: one flat list containing all courses from all three departments.
const allCourses = [...computerScienceCourses, ...mathematicsCourses, ...physicsCourses];

module.exports = allCourses;
