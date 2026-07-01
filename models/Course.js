const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    courseCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    unit: {
      type: Number,
      required: true,
      min: 0,
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

    department: {
      type: String,
      required: true,
      enum: ['Computer Science', 'Mathematics', 'Physics'],
    },

    prerequisites: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

courseSchema.index({ courseCode: 1, department: 1, level: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('Course', courseSchema);
