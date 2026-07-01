const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    role: {
      type: String,
      required: true,
      enum: ['student', 'lecturer', 'admin'],
    },

    matricNumber: {
      type: String,
      trim: true,
    },

    staffId: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    department: {
      type: String,
      enum: ['Computer Science', 'Mathematics', 'Physics'],
    },

    level: {
      type: Number,
      enum: [100, 200, 300, 400, 500],
    },

    entryYear: {
      type: Number,
    },
  },
  {
    timestamps: true,
  },
);

// --- Unique identifiers, but ONLY when the field is actually present ---
// A partial index enforces uniqueness only on documents where the field
// exists AND is a string. Documents where it's null/absent are skipped,
// which is exactly what we need since each role uses only ONE identifier.

userSchema.index(
  { matricNumber: 1 },
  { unique: true, partialFilterExpression: { matricNumber: { $type: 'string' } } },
);

userSchema.index(
  { staffId: 1 },
  { unique: true, partialFilterExpression: { staffId: { $type: 'string' } } },
);

userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: 'string' } } },
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
