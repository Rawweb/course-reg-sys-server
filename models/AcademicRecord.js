const mongoose = require('mongoose');

const academicRecordSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    courseCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    grade: {
      type: String,
      required: true,
      enum: ['A', 'B', 'C', 'D', 'E', 'F'],
    },

    session: {
      type: String,
      required: true,
    },

    level: {
      type: Number,
      required: true,
      enum: [100, 200, 300, 400, 500],
    },
    semester: {
      type: Number,
      required: true,
      enum: [1, 2],
    },
  },
  {
    timestamps: true,
  },
);

academicRecordSchema.virtual('passed').get(function () {
  return this.grade !== 'F';
});

academicRecordSchema.set('toJSON', { virtuals: true });
academicRecordSchema.set('toObject', { virtuals: true });

// Prevent the same student having two records for the same course in the same
// session — a data-integrity guard against accidental duplicates.
academicRecordSchema.index({ student: 1, courseCode: 1, session: 1 }, { unique: true });

module.exports = mongoose.model('AcademicRecord', academicRecordSchema);
