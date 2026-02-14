export interface GuidanceItem {
  metric: string;
  outlook: string;
  timeframe: string;
}

export interface AnalysisResult {
  sentiment: "Optimistic" | "Cautious" | "Neutral" | "Pessimistic";
  sentiment_reasoning: string;
  confidence_score: "High" | "Medium" | "Low";
  positives: string[];
  negatives: string[];
  guidance: GuidanceItem[];
  capacity_utilization: string;
  growth_initiatives: string[];
}
