/**
 * 🎓 Centralized Institutional Branch Master Configuration (Frontend)
 * JNTUH University College of Engineering Sulthanpur
 *
 * Reused in Registration, Student Profile, TPO Directory, Placement Announcements,
 * Eligibility Engine, Filters, Excel Export, Google Sheets Sync.
 */

export interface BranchDefinition {
  code: string;
  shortName: string;
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

export const BRANCH_ALIAS_MAP: Record<string, OfficialBranch> = {
  'cse': 'CSE',
  'computer science & engineering': 'CSE',
  'computer science and engineering': 'CSE',
  'cse sf': 'CSE SF',
  'cse-sf': 'CSE SF',
  'cse (sf)': 'CSE SF',
  'computer science & engineering (self finance)': 'CSE SF',
  'csm': 'CSM',
  'aiml': 'CSM',
  'ai & ml': 'CSM',
  'computer science and engineering (ai & ml)': 'CSM',
  'csc': 'CSC',
  'cyber security': 'CSC',
  'computer science and cyber security': 'CSC',
  'ece': 'ECE',
  'electronics & communication engineering': 'ECE',
  'eee': 'EEE',
  'electrical & electronics engineering': 'EEE',
  'me': 'ME',
  'mech': 'ME',
  'mechanical engineering': 'ME',
  'ce': 'CE',
  'civil': 'CE',
  'civil engineering': 'CE',
};

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

  const matched = OFFICIAL_BRANCHES.find(
    (b) => b.toLowerCase() === lower
  );
  if (matched) return matched;

  return clean;
}
