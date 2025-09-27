export interface SpecialistCard {
  id: string
  displayName: string
  city: string | null
  onlineOnly: boolean
  priceMinCents: number | null
  priceMaxCents: number | null
  experienceYears: number
  categories: string[]
  verified: boolean
  avatarUrl: string | null
}

export interface SpecialistsResponse {
  items: SpecialistCard[]
  total: number
}

export interface SpecialistsFilters {
  category?: string
  format?: 'online' | 'offline' | 'any'
  city?: string
  minExp?: number
  priceMin?: number
  priceMax?: number
  q?: string
  verifiedOnly?: boolean
  sort?: 'recent' | 'price_asc' | 'price_desc'
  limit?: number
  offset?: number
}

export interface SpecialistCategory {
  slug: string
  name: string
}

export interface SpecialistProfile {
  id: string
  displayName: string
  bio: string
  city: string | null
  onlineOnly: boolean
  experienceYears: number
  priceMinCents: number | null
  priceMaxCents: number | null
  categories: SpecialistCategory[]
  verified: boolean
  avatarUrl: string | null
  createdAt: string
}
