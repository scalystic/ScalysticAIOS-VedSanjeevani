/** Metric cards shown at the top of a dashboard */
export type DashboardCard =
  | 'totalSpend'
  | 'totalRevenue'
  | 'overallRoas'
  | 'activeCampaigns'
  | 'activeContents'
  | 'spend'
  | 'revenue'
  | 'roas'

/** Widgets (charts, tables, lists) shown in the dashboard body */
export type DashboardWidget =
  | 'topContents'
  | 'topAgencies'
  | 'alerts'
  | 'contentPerformance'
  | 'agencyPerformance'
  | 'campaignPerformance'

export type DashboardConfig = {
  cards: DashboardCard[]
  widgets: DashboardWidget[]
}

export type DashboardsConfig = typeof dashboards

export const dashboards = {
  home: {
    cards: [
      'totalSpend',
      'totalRevenue',
      'overallRoas',
      'activeCampaigns',
      'activeContents',
    ],
    widgets: [
      'topContents',
      'topAgencies',
      'alerts',
    ],
  },

  marketing: {
    cards: [
      'spend',
      'revenue',
      'roas',
      'activeCampaigns',
    ],
    widgets: [
      'contentPerformance',
      'agencyPerformance',
      'campaignPerformance',
    ],
  },
} satisfies Record<string, DashboardConfig>

export type DashboardId = keyof typeof dashboards

/** Returns the dashboard config for a given dashboard id */
export function getDashboard(id: DashboardId): DashboardConfig {
  return dashboards[id]
}
