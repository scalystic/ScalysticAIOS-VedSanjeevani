export type EntityTab = {
  key: string
  label: string
}

export type EntityTabsConfig = typeof entityTabs

export const entityTabs = {
  content: [
    { key: 'overview',         label: 'Overview'        },
    { key: 'assignments',      label: 'Assignments'     },
    { key: 'platform-assets',  label: 'Platform Assets' },
    { key: 'campaigns',        label: 'Campaigns'       },
    { key: 'performance',      label: 'Performance'     },
    { key: 'history',          label: 'History'         },
  ],

  agency: [
    { key: 'overview',     label: 'Overview'    },
    { key: 'assignments',  label: 'Assignments' },
    { key: 'campaigns',    label: 'Campaigns'   },
    { key: 'performance',  label: 'Performance' },
    { key: 'users',        label: 'Users'       },
  ],

  campaign: [
    { key: 'overview',     label: 'Overview'    },
    { key: 'ads',          label: 'Ads'         },
    { key: 'contents',     label: 'Contents'    },
    { key: 'performance',  label: 'Performance' },
    { key: 'history',      label: 'History'     },
  ],
} satisfies Record<string, EntityTab[]>

export type EntityType = keyof typeof entityTabs

/** Returns the tab config for a given entity type, or [] if not found */
export function getEntityTabs(entity: EntityType): EntityTab[] {
  return entityTabs[entity]
}

/** Returns the default (first) tab key for an entity type */
export function getDefaultTab(entity: EntityType): string {
  return entityTabs[entity][0].key
}
