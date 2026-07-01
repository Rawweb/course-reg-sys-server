const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const loginUser = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Please provide your login ID and password' });
    }

    const user = await User.findOne({
      $or: [
        { matricNumber: identifier },
        { staffId: identifier },
        { email: identifier.toLowerCase() },
      ],
    });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid login credentials' });
    }

    const token = generateToken(user._id, user.role);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        department: user.department || null,
        level: user.level || null,
        matricNumber: user.matricNumber || null,
        staffId: user.staffId || null,
        email: user.email || null,
      },
    });
  } catch (error) {
    console.error(`Login error: ${error.message}`);
    res.status(500).json({ message: 'Server error during login' });
  }
};

const getMe = async (req, res) => {
  res.json({ user: req.user });
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Please provide your current and new password" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user._id);

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error(`Change password error: ${error.message}`);
    res.status(500).json({ message: "Server error while changing password" });
  }
};

module.exports = { loginUser, getMe, changePassword };
