const Registration = require('../models/Registration');

const getPendingRegistrations = async (req, res) => {
  try {
    const lecturer = req.user;

    const pending = await Registration.find({
      status: 'pending',
      department: lecturer.department,
      level: lecturer.level,
    })
      .populate('student', 'name matricNumber email')
      .sort({ createdAt: 1 });

    res.json({
      count: pending.length,
      department: lecturer.department,
      level: lecturer.level,
      registrations: pending,
    });
  } catch (error) {
    console.error(`getPendingRegistrations error: ${error.message}`);
    res.status(500).json({ message: 'Server error fetching registrations' });
  }
};

const reviewRegistration = async (req, res) => {
  try {
    const lecturer = req.user;
    const { id } = req.params;
    const { decision, feedback } = req.body;

    if (!["approve", "reject"].includes(decision)) {
      return res
        .status(400)
        .json({ message: "Decision must be either 'approve' or 'reject'" });
    }

    if (decision === "reject" && (!feedback || feedback.trim() === "")) {
      return res
        .status(400)
        .json({ message: "Please provide feedback when rejecting" });
    }

    const registration = await Registration.findById(id);
    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    if (
      registration.department !== lecturer.department ||
      registration.level !== lecturer.level
    ) {
      return res.status(403).json({
        message: "This registration is not in your advising queue"
      });
    }

    if (registration.status !== "pending") {
      return res.status(409).json({
        message: `This registration was already ${registration.status}`
      });
    }

    registration.status = decision === "approve" ? "approved" : "rejected";
    registration.feedback = feedback ? feedback.trim() : "";
    registration.reviewedBy = lecturer._id; 
    registration.reviewedAt = new Date(); 

    await registration.save();

    res.json({
      message: `Registration ${registration.status} successfully`,
      registration
    });
  } catch (error) {
    console.error(`reviewRegistration error: ${error.message}`);
    res.status(500).json({ message: "Server error reviewing registration" });
  }
};

module.exports = { getPendingRegistrations, reviewRegistration };
