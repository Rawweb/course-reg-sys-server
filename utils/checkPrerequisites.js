const checkPrerequisites = (prerequisites, passedCodesSet) => {
  if (!prerequisites || prerequisites.length === 0) {
    return { eligible: true, missing: [] };
  }

  // Find every prerequisite the student has NOT passed.
  const missing = prerequisites.filter((code) => !passedCodesSet.has(code));

  // Eligible only if nothing is missing.
  return { eligible: missing.length === 0, missing };
};

module.exports = checkPrerequisites;
