export interface StakeDay {
  date: string;
  cardano_staked: number;
  base_staked: number;
  total_staked: number;
  avg_age_days: number;
}

export interface LpDay {
  date: string;
  daily_net_flow: number;
  rolling_7day_avg: number;
  cumulative_balance: number;
}

export interface LpPool {
  token_symbol: string;
  dex: string;
  final_balance: number;
  days: LpDay[];
}

export interface DashboardSummary {
  final_date: string;
  final_cardano_staked: number;
  final_base_staked: number;
  final_total_staked: number;
  final_avg_age_days: number;
  final_cardano_rewards: number;
  final_base_rewards: number;
  final_total_rewards: number;
  final_cardano_node_rewards: number;
  final_base_node_rewards: number;
  final_total_node_rewards: number;
  estimated_circulating_supply: number | null;
  migrated_total: number | null;
  migrated_last_7_days: number | null;
  migrated_last_30_days: number | null;
}

export interface CombinedDashboardData {
  generated_at_utc: string;
  summary: DashboardSummary;
  stake_days: StakeDay[];
  lp_staking: {
    lp_rise_weth_aero: LpPool;
    lp_rise_weth_univ2: LpPool;
  };
}

export interface PoolDailySummary {
  chain: string;
  pool_name: string;
  date: string;
  buy_volume: number;
  sell_volume: number;
  lp_add_volume: number;
  lp_remove_volume: number;
}

export interface PoolSummaryData {
  daily_summary: PoolDailySummary[];
}

/** One day's net delta + 7-day rolling average, derived client-side from a StakeDay series. */
export interface FlowDay {
  date: string;
  net: number;
  rollingAvg: number;
  cumulative: number;
}
