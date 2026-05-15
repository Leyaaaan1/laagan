// ─────────────────────────────────────────────
// authValidation.js
// Pure validation logic for AuthScreen.
// Returns { valid: bool, rules: [...] } per field.
// ─────────────────────────────────────────────

export const EMAIL_RULES = [
  {
    key: 'required',
    label: 'Email is required',
    test: v => v.trim().length > 0,
  },
  {
    key: 'format',
    label: 'Invalid email format',
    test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
  },
];

export const PASSWORD_RULES = [
  {
    key: 'required',
    label: 'Password is required',
    test: v => v.length > 0,
  },
  {
    key: 'minLength',
    label: 'At least 8 characters',
    test: v => v.length >= 8,
  },
  {
    key: 'maxLength',
    label: 'Under 128 characters',
    test: v => v.length <= 128,
  },
  {
    key: 'uppercase',
    label: 'At least one uppercase letter',
    test: v => /[A-Z]/.test(v),
  },
  {
    key: 'number',
    label: 'At least one number',
    test: v => /[0-9]/.test(v),
  },
];

export const CONFIRM_RULES = password => [
  {
    key: 'required',
    label: 'Please confirm your password',
    test: v => v.length > 0,
  },
  {
    key: 'match',
    label: 'Passwords match',
    test: v => v === password,
  },
];

/**
 * Evaluate a set of rules against a value.
 * Returns { allPassed, rules: [{ key, label, passed }] }
 */
export const evaluateRules = (rules, value) => {
  const evaluated = rules.map(rule => ({
    key: rule.key,
    label: rule.label,
    passed: rule.test(value),
  }));
  return {
    allPassed: evaluated.every(r => r.passed),
    rules: evaluated,
  };
};

/**
 * Full form validation — returns true only if all fields pass.
 */
export const isFormValid = (username, password, confirmPassword, isLogin) => {
  const uValid = evaluateRules(EMAIL_RULES, username).allPassed;
  const pValid = evaluateRules(PASSWORD_RULES, password).allPassed;
  if (isLogin) return uValid && pValid;
  const cValid = evaluateRules(
    CONFIRM_RULES(password),
    confirmPassword,
  ).allPassed;
  return uValid && pValid && cValid;
};
