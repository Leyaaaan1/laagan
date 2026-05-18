/** * Utilities for custom prop comparison in React.memo * Helps optimize components that receive many props */

/** * Compare function factory for React.memo * Ignores specific callback props that are always new references *
 * @param {string[]} callbackProps - Names of callback props to ignore in comparison * @returns {Function} Comparison function for React.memo */
export const createMemoCompare = (callbackProps = []) => {
  return (prevProps, nextProps) => {
    // Get all keys except the ones we want to ignore
    const allKeys = Object.keys(prevProps);

    for (const key of allKeys) {
      // Skip callback comparison (they're always new references)
      if (callbackProps.includes(key)) {
        continue;
      }

      if (prevProps[key] !== nextProps[key]) {
        // Props differ, component should re-render
        return false;
      }
    }

    // All compared props are equal, skip re-render
    return true;
  };
};

/** * Quick comparison for specific props only * Use when you have a small set of props that matter *
 * @param {string[]} significantProps - Only check these props * @returns {Function} Comparison function for React.memo */
export const createSelectiveMemoCompare = (significantProps = []) => {
  return (prevProps, nextProps) => {
    for (const key of significantProps) {
      if (prevProps[key] !== nextProps[key]) {
        return false; // Re-render if any significant prop changed
      }
    }
    return true; // Skip re-render
  };
};

/** * Deep comparison for objects/arrays in props * Use sparingly as it's slower *
 * @param {*} a - First value * @param {*} b - Second value * @returns {boolean} True if deeply equal */
export const deepEqual = (a, b) => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!deepEqual(a[key], b[key])) return false;
  }

  return true;
};
