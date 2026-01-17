import { Norms, InteractionType } from '../types';

export const recruitingNorms: Norms = {
  'Coffee Chat': { optimalWindow: [3, 6] },
  'Referral Intro': { optimalWindow: [5, 10] },
  'Recruiter Email': { optimalWindow: [7, 14] },
  'Post-Interview': { optimalWindow: [2, 5] },
};

export function getOptimalWindow(
  interactionType: InteractionType,
  windowShift: number = 0
): [number, number] {
  const baseWindow = recruitingNorms[interactionType].optimalWindow;
  return [baseWindow[0] + windowShift, baseWindow[1] + windowShift];
}
