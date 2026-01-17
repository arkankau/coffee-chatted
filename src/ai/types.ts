export type FitAIOutput = {
  industry_match: 0 | 1 | 'unknown';
  role_match: 0 | 1 | 'unknown';
  seniority_bucket: 'student' | 'analyst' | 'associate' | 'manager_plus' | 'unknown';
  notes: {
    normalized_industry: string;
    normalized_role: string;
  };
  confidence: number;
  explanation: string;
};

export type PolishOutput = {
  title: string;
  body: string;
};
