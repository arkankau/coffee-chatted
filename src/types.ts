export type InteractionType = "Coffee Chat" | "Referral Intro" | "Recruiter Email" | "Post-Interview";

export type TimingState = "TOO_EARLY" | "OPTIMAL" | "LATE";

export type NudgeType = "FOLLOW_UP" | "DO_NOTHING_YET" | "SILENT";

export type SharedConnection = 
  | "Same school"
  | "Same student org"
  | "Same hometown/country"
  | "Friend-of-friend intro"
  | "Same previous company"
  | "None";

export interface Thread {
  id: string;
  name: string;
  company: string;
  roleTitle: string;
  industry: string;
  interactionType: InteractionType;
  lastInteractionDate: string; // ISO string
  followupAlreadySent: boolean;
  priorEngagement: boolean;
  typicalResponseLatencyDays: number;
  sharedConnection: SharedConnection;
  nudgedAlready: boolean;
  ignoredNudgesCount: number;
  suppressThread?: boolean;
  overrideFit?: boolean;
}

export interface UserFocus {
  targetIndustry: string;
  targetRole: string;
  recruitingStage: string;
}

export interface Norms {
  [key: string]: { optimalWindow: [number, number] };
}

export interface Decision {
  shouldNudge: boolean;
  nudgeType: NudgeType;
  reasons: string[];
  inputsUsed: string[];
  confidenceScore: number;
  fitScore: number;
  timingState: TimingState;
  daysSince: number;
}

export type NudgeOutcome = 'dismissed' | 'ignored' | 'accepted';

export interface NudgeRecord {
  threadId: string;
  threadName: string;
  date: string;
  confidenceScore: number;
  outcome: NudgeOutcome | null;
}

export interface LearningState {
  userThreshold: number;
  windowShifts: { [key in InteractionType]?: number };
  threadOverrides: { [threadId: string]: Partial<Thread> & { threadCooldownEnd?: string } };
  nudgeHistory: Array<{ threadId: string; date: string }>;
  suppressedThreads: Set<string>;
  nudgeRecords: NudgeRecord[];
}
