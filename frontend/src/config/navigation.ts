import {
  Home,
  BarChart3,
  FileVideo,
  Building2,
  Megaphone,
  LineChart,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export type NavChild = {
  id: string
  label: string
  icon?: LucideIcon
  path: string
  permission: string
  /** Pass true when the path shares a prefix with sibling routes (e.g. /marketing vs /marketing/contents) */
  end?: boolean
}

export type NavItem = {
  id: string
  label: string
  icon: LucideIcon
  path?: string
  permission?: string
  children?: NavChild[]
}

export const navigation: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    path: '/',
    permission: 'dashboard.view',
  },

  {
    id: 'marketing',
    label: 'Marketing',
    icon: BarChart3,
    children: [
      {
        id: 'marketing-overview',
        label: 'Overview',
        icon: BarChart3,
        path: '/marketing',
        permission: 'analytics.view',
        end: true,
      },
      {
        id: 'contents',
        label: 'Contents',
        icon: FileVideo,
        path: '/marketing/contents',
        permission: 'content.view',
      },
      {
        id: 'agencies',
        label: 'Agencies',
        icon: Building2,
        path: '/marketing/agencies',
        permission: 'agency.view',
      },
      {
        id: 'campaigns',
        label: 'Campaigns',
        icon: Megaphone,
        path: '/marketing/campaigns',
        permission: 'campaign.view',
      },
      {
        id: 'analytics',
        label: 'Analytics',
        icon: LineChart,
        path: '/marketing/analytics',
        permission: 'analytics.view',
      },
    ],
  },

  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/settings',
    permission: 'settings.manage',
  },
]

/** Flat list of all nav items that have a path (for route generation, breadcrumbs, etc.) */
export const flatNavItems: NavChild[] = navigation.flatMap((item) =>
  item.children
    ? item.children
    : item.path
      ? [{ id: item.id, label: item.label, icon: item.icon, path: item.path, permission: item.permission ?? '' }]
      : []
)

/** Look up any nav item by id, searching top-level and children */
export function findNavItem(id: string): NavItem | NavChild | undefined {
  for (const item of navigation) {
    if (item.id === id) return item
    const child = item.children?.find((c) => c.id === id)
    if (child) return child
  }
}
