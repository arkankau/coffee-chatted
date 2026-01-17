interface FitPromptArgs {
  targetIndustry: string;
  targetRole: string;
  company: string;
  roleTitle: string;
  industryText: string;
  seniorityText: string;
}

interface TonePromptArgs {
  contactName: string;
  interactionType: string;
  daysSince: number;
  window: string;
  sharedConnection: string;
  reasons: string[];
  rawMessage: string;
}

/**
 * Builds the user prompt for fit normalization
 */
export function buildFitPrompt(args: FitPromptArgs): string {
  return `You are a recruiter's assistant normalizing profile text for fit matching.

Target profile:
- Target Industry: ${args.targetIndustry}
- Target Role: ${args.targetRole}

Contact profile:
- Company: ${args.company}
- Role Title: ${args.roleTitle}
- Industry (as provided): ${args.industryText}
- Seniority indicators: ${args.seniorityText}

Task: Assess fit between target and contact profile.

Rules:
1. Be CONSERVATIVE. If unsure about any match, use "unknown" and set confidence <= 0.6.
2. Do NOT invent facts. Use only the provided information.
3. Return ONLY valid JSON, no extra text, no markdown, no explanations outside JSON.

Return a JSON object with this EXACT schema:
{
  "industry_match": 0 | 1 | "unknown",
  "role_match": 0 | 1 | "unknown",
  "seniority_bucket": "student" | "analyst" | "associate" | "manager_plus" | "unknown",
  "notes": {
    "normalized_industry": string,
    "normalized_role": string
  },
  "confidence": number (0.0 to 1.0),
  "explanation": string (one sentence explaining the assessment)
}

Field meanings:
- industry_match: 1 if industries clearly match, 0 if clearly don't, "unknown" if uncertain
- role_match: 1 if roles/keywords clearly match, 0 if clearly don't, "unknown" if uncertain
- seniority_bucket: categorize the role level
- notes.normalized_industry: standardized industry name
- notes.normalized_role: standardized role name
- confidence: how confident you are (use <= 0.6 if any "unknown")
- explanation: brief one-sentence explanation

Return ONLY the JSON object now:`;
}

/**
 * Builds the user prompt for tone polishing
 */
export function buildTonePrompt(args: TonePromptArgs): string {
  const reasonsText = args.reasons.length > 0 ? args.reasons.join('; ') : 'Follow-up suggested';
  
  return `You are polishing a notification message for a professional networking follow-up reminder.

Context:
- Contact: ${args.contactName}
- Interaction type: ${args.interactionType}
- Days since last interaction: ${args.daysSince}
- Optimal window: ${args.window}
- Shared connection: ${args.sharedConnection}
- Reasons: ${reasonsText}
- Raw message: "${args.rawMessage}"

Task: Rewrite this into a calm, optional in-app notification (1-2 sentences max).

Constraints:
- Calm, non-pushy tone
- Optional language ("If you want", "Optional")
- NO urgency or pressure
- NO new facts beyond what's provided
- NO mention of AI or automation
- Keep it brief (1-2 sentences)

Return ONLY valid JSON with this EXACT schema:
{
  "title": string (short, calm heading, max 10 words),
  "body": string (calm message, 1-2 sentences)
}

Return ONLY the JSON object now:`;
}
