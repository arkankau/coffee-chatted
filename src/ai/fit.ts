import { callAIJson, hasAIKey } from './client';
import { validateFitJson } from './validate';
import { buildFitPrompt } from './prompts';
import { FitAIOutput } from './types';
import { Thread, UserFocus } from '../types';

interface NormalizeFitArgs {
  thread: Thread;
  userFocus: UserFocus;
}

/**
 * Attempts to normalize fit using AI
 * Returns null if AI fails, is uncertain (confidence < 0.75), or key is missing
 */
export async function aiNormalizeFit(args: NormalizeFitArgs): Promise<FitAIOutput | null> {
  if (!hasAIKey()) {
    return null;
  }

  try {
    const prompt = buildFitPrompt({
      targetIndustry: args.userFocus.targetIndustry,
      targetRole: args.userFocus.targetRole,
      company: args.thread.company,
      roleTitle: args.thread.roleTitle,
      industryText: args.thread.industry,
      seniorityText: args.thread.roleTitle, // Use roleTitle as seniority indicator
    });

    const response = await callAIJson(prompt);
    const validated = validateFitJson(response);

    if (!validated) {
      return null;
    }

    // Require confidence >= 0.75 to use AI output
    if (validated.confidence < 0.75) {
      return null;
    }

    return validated;
  } catch (error) {
    // Fail safe: return null on any error
    console.warn('AI fit normalization failed:', error);
    return null;
  }
}
