/**
 * 🎓 Configurable Institutional Roll Number Parser
 * JNTUH University College of Engineering Sulthanpur
 *
 * Examples:
 * 23SS1A0535 -> 2023, 2023-2027, REGULAR, Branch: CSE, Roll Sequence: 35
 * 24SS5A0501 -> 2024, 2024-2027, LATERAL_ENTRY, Branch: CSE, Roll Sequence: 01
 */

import { JNTU_BRANCH_NUMERIC_CODES, normalizeBranch, OfficialBranch } from '../config/branchConfig';

export type EntryType = 'REGULAR' | 'LATERAL_ENTRY' | 'TRANSFER' | 'SPECIAL_ENTRY';
export type ResolutionMode = 'AUTOMATIC' | 'ASSISTED' | 'MANUAL';

export interface ParsedRollIdentity {
  normalizedRollNumber: string;
  isValidFormat: boolean;
  resolutionMode: ResolutionMode;
  admissionYear: number;
  graduationYear: number;
  batch: string;
  entryType: EntryType;
  branchCode: string;
  branch: OfficialBranch | string;
  rollSequence: string;
  institutionCode: string;
  message?: string;
}

export interface RollNumberRules {
  standardLength: number; // 10 chars, e.g. 23SS1A0535
  allowedInstitutionCodes: string[]; // 'SS' for Sulthanpur
  entryCodeMap: Record<string, { type: EntryType; durationYears: number }>;
}

export const DEFAULT_ROLL_RULES: RollNumberRules = {
  standardLength: 10,
  allowedInstitutionCodes: ['SS'],
  entryCodeMap: {
    '1A': { type: 'REGULAR', durationYears: 4 },
    '5A': { type: 'LATERAL_ENTRY', durationYears: 3 },
    '2A': { type: 'TRANSFER', durationYears: 3 },
    '3A': { type: 'SPECIAL_ENTRY', durationYears: 4 },
  },
};

/**
 * Parses any institutional roll number into structured academic identity.
 */
export function parseRollNumber(
  input?: string | null,
  rules: RollNumberRules = DEFAULT_ROLL_RULES
): ParsedRollIdentity {
  const normalized = (input || '').trim().toUpperCase();

  const fallbackYear = new Date().getFullYear();
  const fallback: ParsedRollIdentity = {
    normalizedRollNumber: normalized,
    isValidFormat: false,
    resolutionMode: 'MANUAL',
    admissionYear: fallbackYear,
    graduationYear: fallbackYear + 4,
    batch: `${fallbackYear}-${fallbackYear + 4}`,
    entryType: 'REGULAR',
    branchCode: '',
    branch: 'CSE',
    rollSequence: '',
    institutionCode: '',
    message: "We couldn't automatically identify this roll number.",
  };

  if (!normalized || normalized.length < 5) {
    return fallback;
  }

  // Regex pattern for standard JNTUH UCES format:
  // (2 digits Year)(2 chars College Code)(2 chars Entry Code)(2 chars Branch Code)(2 chars/digits Sequence)
  // e.g. 23SS1A0535 or 24SS5A0501 or 22SS1A6612
  const standardPattern = /^(\d{2})([A-Z]{2})([0-9][A-Z])([0-9A-Z]{2})([0-9A-Z]{2})$/;
  const match = normalized.match(standardPattern);

  if (match) {
    const [, yyStr, collegeCode, entryCode, branchCodeRaw, seq] = match;
    const admissionYear = 2000 + parseInt(yyStr, 10);
    const entryConfig = rules.entryCodeMap[entryCode] || { type: 'REGULAR', durationYears: 4 };
    const graduationYear = admissionYear + entryConfig.durationYears;
    const batch = `${admissionYear}-${graduationYear}`;

    // Resolve branch from code
    const resolvedBranch = JNTU_BRANCH_NUMERIC_CODES[branchCodeRaw] || normalizeBranch(branchCodeRaw);
    const isBranchKnown = Boolean(JNTU_BRANCH_NUMERIC_CODES[branchCodeRaw]);

    return {
      normalizedRollNumber: normalized,
      isValidFormat: true,
      resolutionMode: isBranchKnown ? 'AUTOMATIC' : 'ASSISTED',
      admissionYear,
      graduationYear,
      batch,
      entryType: entryConfig.type,
      branchCode: branchCodeRaw,
      branch: resolvedBranch,
      rollSequence: seq,
      institutionCode: collegeCode,
      message: isBranchKnown
        ? 'Roll number recognized successfully'
        : 'Recognized admission year and entry type, please verify your branch.',
    };
  }

  // Handle secondary/relaxed formats (e.g. 23SS1A05... with variable suffix)
  const relaxedPattern = /^(\d{2})([A-Z]{2})([0-9][A-Z])([0-9A-Z]+)$/;
  const relaxedMatch = normalized.match(relaxedPattern);

  if (relaxedMatch) {
    const [, yyStr, collegeCode, entryCode, remainder] = relaxedMatch;
    const admissionYear = 2000 + parseInt(yyStr, 10);
    const entryConfig = rules.entryCodeMap[entryCode] || { type: 'REGULAR', durationYears: 4 };
    const graduationYear = admissionYear + entryConfig.durationYears;
    const batch = `${admissionYear}-${graduationYear}`;

    const branchPart = remainder.substring(0, 2);
    const seqPart = remainder.substring(2);
    const resolvedBranch = JNTU_BRANCH_NUMERIC_CODES[branchPart] || normalizeBranch(branchPart);

    return {
      normalizedRollNumber: normalized,
      isValidFormat: true,
      resolutionMode: 'ASSISTED',
      admissionYear,
      graduationYear,
      batch,
      entryType: entryConfig.type,
      branchCode: branchPart,
      branch: resolvedBranch,
      rollSequence: seqPart,
      institutionCode: collegeCode,
      message: 'Partially identified pattern. Please verify your branch details.',
    };
  }

  return fallback;
}
