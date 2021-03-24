module.exports = {
  extends: ['@commitlint/config-conventional'],

  rules: {
    "type-enum": ["feat", "fix", "chore", "test", "refactor", "style", "cosm", "docs", "build", "revert"],
  }
}
