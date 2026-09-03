/**
 * 🎓 Academic Semester & Branch Constants and Helper Utilities
 */

export const VALID_BRANCHES = [
  'CSE',
  'CSE SF',
  'CSC',
  'CSM',
  'ECE',
  'ME',
  'EEE',
  'Civil',
] as const;

export type BranchType = typeof VALID_BRANCHES[number];

// Standard branch name mapping (for backward compatibility with full department names)
export const BRANCH_NAME_MAP: Record<string, string> = {
  'Computer Science & Engineering': 'CSE',
  'Computer Science & Engineering (Self Finance)': 'CSE SF',
  'Computer Science and Cyber Security': 'CSC',
  'Computer Science and Machine Learning': 'CSM',
  'Electronics & Communication Engineering': 'ECE',
  'Mechanical Engineering': 'ME',
  'Electrical & Electronics Engineering': 'EEE',
  'Civil Engineering': 'Civil',
  'Artificial Intelligence & Machine Learning': 'CSM',
  'Information Technology': 'CSE',
};

// Maps Semester Numbers (1-8) to Semester Codes ('1-1' to '4-2')
export const SEMESTER_MAP: Record<number, string> = {
  1: '1-1',
  2: '1-2',
  3: '2-1',
  4: '2-2',
  5: '3-1',
  6: '3-2',
  7: '4-1',
  8: '4-2',
};

// Inverse Map: Semester Code to Semester Number
export const CODE_TO_SEMESTER_MAP: Record<string, number> = {
  '1-1': 1,
  '1-2': 2,
  '2-1': 3,
  '2-2': 4,
  '3-1': 5,
  '3-2': 6,
  '4-1': 7,
  '4-2': 8,
};

/**
 * Converts a semester number (1-8) to its code (e.g., 5 -> "3-1")
 */
export const semesterToCode = (sem: number): string => {
  return SEMESTER_MAP[sem] || `${sem}`;
};

/**
 * Converts a semester code (e.g., "3-1") or number to its integer semester number (1-8)
 */
export const codeToSemester = (val: string | number): number => {
  if (typeof val === 'number') {
    return val >= 1 && val <= 8 ? val : 1;
  }
  const clean = val.trim();
  if (CODE_TO_SEMESTER_MAP[clean]) {
    return CODE_TO_SEMESTER_MAP[clean];
  }
  const parsed = parseInt(clean, 10);
  return !isNaN(parsed) && parsed >= 1 && parsed <= 8 ? parsed : 1;
};

/**
 * Derives the academic year (1-4) from semester number (1-8)
 * Semester 1-2 -> Year 1
 * Semester 3-4 -> Year 2
 * Semester 5-6 -> Year 3
 * Semester 7-8 -> Year 4
 */
export const getYearFromSemester = (sem: number): number => {
  const safeSem = Math.min(Math.max(sem, 1), 8);
  return Math.ceil(safeSem / 2);
};

/**
 * Validates a semester transition (e.g. 1-1 -> 1-2, 1-2 -> 2-1, ..., 4-1 -> 4-2)
 */
export const isValidPromotion = (fromSem: number, toSem: number): boolean => {
  return toSem === fromSem + 1 && fromSem >= 1 && toSem <= 8;
};
