/**
 * 🎓 Centralized Institutional Branch Master Configuration
 * JNTUH University College of Engineering Sulthanpur
 *
 * DO NOT duplicate this configuration. Import and reuse across all services:
 * Registration, Student Profile, TPO Directory, Placement Announcements,
 * Eligibility Engine, Filters, Excel Export, Google Sheets Sync, Analytics.
 */

export interface BranchDefinition {
  code: string; // Internal identifier
  shortName: string; // Display code: 'CSE', 'CE', etc.
  fullName: string;
  department: string;
  isSelfFinance?: boolean;
}

export const BRANCH_MASTER: readonly BranchDefinition[] = [
  {
    code: 'CSE',
    shortName: 'CSE',
    fullName: 'Computer Science & Engineering',
    department: 'Department of Computer Science & Engineering',
  },
  {
    code: 'CSE_SF',
    shortName: 'CSE SF',
    fullName: 'Computer Science & Engineering (Self Finance)',
    department: 'Department of Computer Science & Engineering',
    isSelfFinance: true,
  },
  {
    code: 'CSM',
    shortName: 'CSM',
    fullName: 'Computer Science & Engineering (AI & ML)',
    department: 'Department of Computer Science & Engineering',
  },
  {
    code: 'CSC',
    shortName: 'CSC',
    fullName: 'Computer Science & Engineering (Cyber Security)',
    department: 'Department of Computer Science & Engineering',
  },
  {
    code: 'ECE',
    shortName: 'ECE',
    fullName: 'Electronics & Communication Engineering',
    department: 'Department of Electronics & Communication Engineering',
  },
  {
    code: 'EEE',
    shortName: 'EEE',
    fullName: 'Electrical & Electronics Engineering',
    department: 'Department of Electrical & Electronics Engineering',
  },
  {
    code: 'ME',
    shortName: 'ME',
    fullName: 'Mechanical Engineering',
    department: 'Department of Mechanical Engineering',
  },
  {
    code: 'CE',
    shortName: 'CE',
    fullName: 'Civil Engineering',
    department: 'Department of Civil Engineering',
  },
] as const;

// Official branch short names list
export const OFFICIAL_BRANCHES = [
  'CSE',
  'CSE SF',
  'CSM',
  'CSC',
  'ECE',
  'EEE',
  'ME',
  'CE',
] as const;

export type OfficialBranch = typeof OFFICIAL_BRANCHES[number];

// Alias mapping to normalize legacy database names & variations
export const BRANCH_ALIAS_MAP: Record<string, OfficialBranch> = {
  // Variations for CSE
  'cse': 'CSE',
  'computer science & engineering': 'CSE',
  'computer science and engineering': 'CSE',
  'computer science': 'CSE',

  // Variations for CSE SF
  'cse sf': 'CSE SF',
  'cse-sf': 'CSE SF',
  'cse (sf)': 'CSE SF',
  'computer science & engineering (self finance)': 'CSE SF',
  'computer science and engineering (self finance)': 'CSE SF',
  'computer science & engineering (sf)': 'CSE SF',

  // Variations for CSM
  'csm': 'CSM',
  'aiml': 'CSM',
  'ai & ml': 'CSM',
  'ai and ml': 'CSM',
  'computer science and machine learning': 'CSM',
  'computer science and engineering (ai & ml)': 'CSM',
  'artificial intelligence & machine learning': 'CSM',

  // Variations for CSC
  'csc': 'CSC',
  'cyber security': 'CSC',
  'computer science and cyber security': 'CSC',
  'computer science & engineering (cyber security)': 'CSC',

  // Variations for ECE
  'ece': 'ECE',
  'electronics & communication engineering': 'ECE',
  'electronics and communication engineering': 'ECE',

  // Variations for EEE
  'eee': 'EEE',
  'electrical & electronics engineering': 'EEE',
  'electrical and electronics engineering': 'EEE',

  // Variations for ME
  'me': 'ME',
  'mech': 'ME',
  'mechanical engineering': 'ME',

  // Variations for CE
  'ce': 'CE',
  'civil': 'CE',
  'civil engineering': 'CE',
};

// Numeric code mapping commonly used in JNTUH roll numbers
export const JNTU_BRANCH_NUMERIC_CODES: Record<string, OfficialBranch> = {
  '01': 'CE',
  '1': 'CE',
  '02': 'EEE',
  '2': 'EEE',
  '03': 'ME',
  '3': 'ME',
  '04': 'ECE',
  '4': 'ECE',
  '05': 'CSE',
  '5': 'CSE',
  '06': 'CSE SF',
  '6': 'CSE SF',
  '62': 'CSC',
  '66': 'CSM',
};

/**
 * Normalizes any branch string or numeric code to the official canonical shortName.
 * Defaults to the original string if unknown.
 */
export function normalizeBranch(branchInput?: string | null): OfficialBranch | string {
  if (!branchInput) return 'CSE';
  const clean = branchInput.trim();
  const lower = clean.toLowerCase();

  if (BRANCH_ALIAS_MAP[lower]) {
    return BRANCH_ALIAS_MAP[lower];
  }

  if (JNTU_BRANCH_NUMERIC_CODES[clean]) {
    return JNTU_BRANCH_NUMERIC_CODES[clean];
  }

  // Check if it already matches one of the official branches case-insensitively
  const matched = OFFICIAL_BRANCHES.find(
    (b) => b.toLowerCase() === lower
  );
  if (matched) return matched;

  return clean;
}
