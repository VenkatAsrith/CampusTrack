/**
 * Centralized CGPA Calculator utility for CampusTrack
 * Calculates Overall CGPA on a 10.0 scale from semester percentage results.
 */

export interface SemesterResult {
  semester: number;
  percentage: number;
}

export const calculateCGPAFromSemesters = (semesterResults?: SemesterResult[]): number => {
  if (!semesterResults || !Array.isArray(semesterResults) || semesterResults.length === 0) {
    return 0;
  }

  const validEntries = semesterResults.filter(
    (item) => typeof item.percentage === 'number' && !isNaN(item.percentage) && item.percentage > 0
  );

  if (validEntries.length === 0) {
    return 0;
  }

  const totalPercentage = validEntries.reduce((sum, item) => sum + item.percentage, 0);
  const averagePercentage = totalPercentage / validEntries.length;

  // Standard institutional percentage to 10.0 CGPA conversion:
  // e.g. 85.0% -> 8.5 CGPA, rounded to 2 decimal places.
  const rawCGPA = averagePercentage / 10;
  return Number(Math.min(10, Math.max(0, rawCGPA)).toFixed(2));
};
