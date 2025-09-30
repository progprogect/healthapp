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

export interface GetSpecialistsResponse {
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

export interface GalleryImage {
  url: string
  alt?: string
  order: number
}

export interface Education {
  id: string
  title: string
  institution: string
  degree?: string
  year?: number
  documentUrl?: string
  documentType: string
  isVerified: boolean
  verifiedAt?: string
  verifiedBy?: string
  createdAt: string
}

export interface Publication {
  id: string
  title: string
  url: string
  type: 'ARTICLE' | 'BOOK' | 'RESEARCH' | 'BLOG_POST' | 'PODCAST' | 'VIDEO'
  year?: number
  isVerified: boolean
  createdAt: string
}

export interface Review {
  id: string
  rating: number
  comment?: string
  isVerified: boolean
  isPublic: boolean
  createdAt: string
  client: {
    id: string
    displayName: string
  }
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
  
  // Новые поля
  videoPresentationUrl?: string
  videoThumbnailUrl?: string
  galleryImages: GalleryImage[]
  languages: string[]
  ageGroups: string[]
  timezone?: string
  averageRating: number
  totalReviews: number
  
  // Связанные данные
  education: Education[]
  publications: Publication[]
  reviews: Review[]
  
  createdAt: string
  updatedAt: string
}
