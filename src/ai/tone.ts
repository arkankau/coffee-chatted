import { callAIJson, hasAIKey } from './client';
import { validatePolishJson } from './validate';
import { buildTonePrompt } from './prompts';
import { PolishOutput } from './types';
import { Thread, Decision, InteractionType } from '../types';
import { getOptimalWindow } from '../logic/norms';

interface PolishNudgeArgs {
  thread: Thread;
  decision: Decision;
  windowShift?: number;
}

/**
 * Polishes nudge tone using AI
 * Returns null if AI fails or key is missing
 */
export async function aiPolishNudge(args: PolishNudgeArgs): Promise<PolishOutput | null> {
  if (!hasAIKey()) {
    return null;
  }

  // Only polish if shouldNudge or DO_NOTHING_YET
  if (!args.decision.shouldNudge && args.decision.nudgeType !== 'DO_NOTHING_YET') {
    return null;
  }

  try {
    const windowShift = args.windowShift || 0;
    const [minDays, maxDays] = getOptimalWindow(args.thread.interactionType as InteractionType, windowShift);
    const windowText = `${minDays}-${maxDays} days`;

    const rawMessage = args.decision.shouldNudge
      ? `If you want, now is within your usual follow-up window for ${args.thread.name}.`
      : args.decision.reasons.join(' ');

    const prompt = buildTonePrompt({
      contactName: args.thread.name,
      interactionType: args.thread.interactionType,
      daysSince: args.decision.daysSince,
      window: windowText,
      sharedConnection: args.thread.sharedConnection,
      reasons: args.decision.reasons,
      rawMessage,
    });

    const response = await callAIJson(prompt);
    const validated = validatePolishJson(response);

    return validated;
  } catch (error) {
    // Fail safe: return null on any error
    console.warn('AI tone polishing failed:', error);
    return null;
  }
}
