// Shared types for dashboard components.

export interface PortfolioItemData {
  itemId: string;
  itemName: string;
  quality: number;
  buyCity: string;
  buyPrice: number;
  blackMarketPrice: number;
  profit: number;
  margin: number;
  itemWeight: number;
  bmVolume7d: number;
  bmConsistency: number;
  bmPriceTrend: "up" | "down" | "stable";
  buyPriceAgeHours?: number;
  bmPriceAgeHours?: number;
  quantity: number;
  totalCost: number;
  totalWeight: number;
  totalProfit: number;
  riskScore: number;
}

export interface CityPortfolioData {
  city: string;
  items: PortfolioItemData[];
  totalInvestment: number;
  totalProfit: number;
  totalWeight: number;
  expectedROI: number;
  loadUtilization: number;
  budgetUtilization: number;
  tripsToTarget: number;
  avgConsistency: number;
  avgRiskScore: number;
  narrative: string;
  survivalProb: number;
  expectedValue: number;
  kellyFraction: number;
  kellyHalfFraction: number;
  recommendedCapital: number;
  ruinProb10Trips: number;
  tripsToTargetEV: number;
  valueDensity: number;
}

export interface PortfolioResult {
  cityPortfolios: CityPortfolioData[];
  mountMaxLoad: number;
  mountName?: string;
  investment: number;
  bankroll: number;
  survivalProb: number;
  targetProfit: number;
  opportunitiesConsidered: number;
}

export interface ScanStatus {
  isScanning: boolean;
  progress: {
    currentItem: string;
    itemIndex: number;
    totalItems: number;
    errors: number;
    done: boolean;
  };
}
