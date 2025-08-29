module.exports = {
  extends: ["@commitlint/config-conventional"],
  ignores: [
    (message) => message.includes("[create-pull-request] automated change"),
    (message) => message.includes("Version Packages"),
  ],
  rules: {
    // Allow longer subject lines for descriptive commits
    "subject-max-length": [2, "always", 100],
    // Allow empty scope for some commit types
    "scope-empty": [0, "never"],
    // Enforce proper case for scope
    "scope-case": [2, "always", "lower-case"],
    // Allow these commit types
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "style",
        "refactor",
        "test",
        "chore",
        "perf",
        "ci",
        "build",
        "revert",
      ],
    ],
  },
};
