import { FitAIOutput, PolishOutput } from './types';

/**
 * Manual validation for FitAIOutput
 */
export function validateFitJson(x: any): FitAIOutput | null {
  if (!x || typeof x !== 'object') return null;

  // Validate industry_match
  if (x.industry_match !== 0 && x.industry_match !== 1 && x.industry_match !== 'unknown') {
    return null;
  }

  // Validate role_match
  if (x.role_match !== 0 && x.role_match !== 1 && x.role_match !== 'unknown') {
    return null;
  }

  // Validate seniority_bucket
  const validSeniority = ['student', 'analyst', 'associate', 'manager_plus', 'unknown'];
  if (!validSeniority.includes(x.seniority_bucket)) {
    return null;
  }

  // Validate notes
  if (!x.notes || typeof x.notes !== 'object') return null;
  if (typeof x.notes.normalized_industry !== 'string') return null;
  if (typeof x.notes.normalized_role !== 'string') return null;

  // Validate confidence
  const confidence = typeof x.confidence === 'number' ? x.confidence : parseFloat(x.confidence);
  if (isNaN(confidence) || confidence < 0 || confidence > 1) {
    return null;
  }

  // Validate explanation
  if (typeof x.explanation !== 'string') return null;

  return {
    industry_match: x.industry_match,
    role_match: x.role_match,
    seniority_bucket: x.seniority_bucket,
    notes: {
      normalized_industry: x.notes.normalized_industry,
      normalized_role: x.notes.normalized_role,
    },
    confidence,
    explanation: x.explanation,
  };
}

/**
 * Manual validation for PolishOutput
 */
export function validatePolishJson(x: any): PolishOutput | null {
  if (!x || typeof x !== 'object') return null;

  if (typeof x.title !== 'string' || x.title.trim().length === 0) {
    return null;
  }

  if (typeof x.body !== 'string' || x.body.trim().length === 0) {
    return null;
  }

  return {
    title: x.title.trim(),
    body: x.body.trim(),
  };
}
