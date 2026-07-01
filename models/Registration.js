const mongoose = require('mongoose');

const registrationCourseSchema = new mongoose.Schema(
  {
    courseCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
    },

    unit: {
      type: Number,
      required: true,
      min: 0,
    },
    level: {
      type: Number,
      required: true,
    },

    isCarryover: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const registrationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    matricNumber: { type: String, required: true },
    department: { type: String, required: true },
    level: { type: Number, required: true },

    session: { type: String, required: true },
    semester: { type: Number, required: true, enum: [1, 2] },

    courses: {
      type: [registrationCourseSchema],
      required: true,
    },

    totalUnits: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },

    feedback: {
      type: String,
      default: '',
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

registrationSchema.index({ student: 1, session: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
