import { createContext, useContext, useState } from 'react'
import contentJson   from '@/data/content.json'
import agenciesJson  from '@/data/agencies.json'
import campaignsJson from '@/data/campaigns.json'
import adsetsJson    from '@/data/adsets.json'
import adsJson       from '@/data/ads.json'
import creatorsJson  from '@/data/creators.json'
import productsJson  from '@/data/products.json'

// ── Domain types ───────────────────────────────────────────────────────────────

export type ContentType        = 'video' | 'image'
export type ContentCategory    = 'ugc' | 'founder_led' | 'team' | 'brand'
export type ContentStatus      = 'unassigned' | 'assigned' | 'received' | 'active' | 'completed'
export type AgencyType         = 'creator' | 'performance'
export type AgencyStatus       = 'active' | 'inactive'
export type CampaignStatus     = 'active' | 'paused' | 'archived' | 'draft'
export type CampaignObjective  = 'conversions' | 'traffic' | 'awareness' | 'lead_generation' | 'engagement' | 'video_views' | 'app_installs'
export type CampaignPlatform   = 'meta' | 'google'
export type CampaignBudgetType = 'daily' | 'lifetime'
export type AdStatus           = 'active' | 'paused' | 'archived'
export type CreatorType        = 'influencer' | 'ugc_creator' | 'in_house'
export type CreatorStatus      = 'active' | 'inactive'
export type ProductCategory    = 'adaptogen' | 'cognitive' | 'digestive' | 'immunity' | 'skin' | 'joint' | 'womens_health' | 'cardiac' | 'respiratory' | 'renal' | 'pain_relief'
export type ProductStatus      = 'active' | 'inactive' | 'draft'

export interface ContentItem {
  id:            string
  name:          string
  type:          ContentType
  category:      ContentCategory
  creator:       string
  product:       string | null
  driveUrl:      string
  thumbnail:     string | null
  agency:        string | null
  status:        ContentStatus
  metaVideoId:   string | null
  campaignCount: number
  spend:         number
  revenue:       number
  roas:          number
  createdAt:     string
}

export interface AgencyItem {
  id:              string
  name:            string
  type:            AgencyType
  contactName:     string
  contactEmail:    string
  contactPhone:    string
  status:          AgencyStatus
  assignedContent: number
  verifiedContent: number
  runningContent:  number
  roas:            number
  joinedAt:        string
}

export interface CampaignItem {
  id:                 string
  name:               string
  objective:          CampaignObjective
  status:             CampaignStatus
  budgetType:         CampaignBudgetType
  budget:             number
  spend:              number
  impressions:        number
  reach:              number
  clicks:             number
  ctr:                number
  cpm:                number
  cpc:                number
  conversions:        number
  costPerConversion:  number
  revenue:            number
  roas:               number
  agency:             string | null
  adAccountId:        string
  platform:           CampaignPlatform
  startDate:          string
  endDate:            string | null
  createdAt:          string
}

export interface AdSetItem {
  id:                string
  campaignId:        string
  name:              string
  status:            AdStatus
  audience:          string
  budgetType:        CampaignBudgetType
  budget:            number
  spend:             number
  impressions:       number
  reach:             number
  clicks:            number
  ctr:               number
  cpm:               number
  cpc:               number
  conversions:       number
  costPerConversion: number
  revenue:           number
  roas:              number
  startDate:         string
  endDate:           string | null
}

export interface AdItem {
  id:           string
  adSetId:      string
  campaignId:   string
  name:         string
  status:       AdStatus
  contentId:    string | null
  contentName:  string
  contentType:  ContentType
  headline:     string
  primaryText:  string
  spend:        number
  impressions:  number
  clicks:       number
  ctr:          number
  conversions:  number
  roas:         number
}

export interface CreatorItem {
  id:           string
  name:         string
  type:         CreatorType
  handle:       string | null
  platform:     string | null
  contactEmail: string
  contactPhone: string
  ratePerVideo: number
  ratePerImage: number
  status:       CreatorStatus
  joinedAt:     string
}

export interface ProductItem {
  id:          string
  name:        string
  sku:         string
  category:    ProductCategory
  description: string
  status:      ProductStatus
  price:       number
  launchDate:  string
}

export const CREATORS = [
  'Priya Sharma',
  'Rahul Mehta',
  'Anika Verma',
  'In House Production',
] as const

export type Creator = (typeof CREATORS)[number]

// ── Context ────────────────────────────────────────────────────────────────────

interface AppDataValue {
  contentItems:      ContentItem[]
  setContentItems:   React.Dispatch<React.SetStateAction<ContentItem[]>>
  agencyItems:       AgencyItem[]
  setAgencyItems:    React.Dispatch<React.SetStateAction<AgencyItem[]>>
  creatorItems:      CreatorItem[]
  setCreatorItems:   React.Dispatch<React.SetStateAction<CreatorItem[]>>
  campaignItems:     CampaignItem[]
  setCampaignItems:  React.Dispatch<React.SetStateAction<CampaignItem[]>>
  adSetItems:        AdSetItem[]
  setAdSetItems:     React.Dispatch<React.SetStateAction<AdSetItem[]>>
  adItems:           AdItem[]
  setAdItems:        React.Dispatch<React.SetStateAction<AdItem[]>>
  productItems:      ProductItem[]
  setProductItems:   React.Dispatch<React.SetStateAction<ProductItem[]>>
}

const AppDataContext = createContext<AppDataValue | null>(null)

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [contentItems,  setContentItems]  = useState<ContentItem[]>(contentJson     as ContentItem[])
  const [agencyItems,   setAgencyItems]   = useState<AgencyItem[]>(agenciesJson     as AgencyItem[])
  const [creatorItems,  setCreatorItems]  = useState<CreatorItem[]>(creatorsJson    as CreatorItem[])
  const [campaignItems, setCampaignItems] = useState<CampaignItem[]>(campaignsJson  as CampaignItem[])
  const [adSetItems,    setAdSetItems]    = useState<AdSetItem[]>(adsetsJson         as AdSetItem[])
  const [adItems,       setAdItems]       = useState<AdItem[]>(adsJson               as AdItem[])
  const [productItems,  setProductItems]  = useState<ProductItem[]>(productsJson     as ProductItem[])

  return (
    <AppDataContext.Provider value={{
      contentItems,  setContentItems,
      agencyItems,   setAgencyItems,
      creatorItems,  setCreatorItems,
      campaignItems, setCampaignItems,
      adSetItems,    setAdSetItems,
      adItems,       setAdItems,
      productItems,  setProductItems,
    }}>
      {children}
    </AppDataContext.Provider>
  )
}

export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider')
  return ctx
}
