// Request API Types

export interface CreateRequestRequest {
  categorySlug: string;
  title: string;
  description: string;
  preferredFormat: 'online' | 'offline' | 'any';
  city?: string;
  budgetMinCents?: number;
  budgetMaxCents?: number;
}

export interface CreateRequestResponse {
  id: string;
  status: string;
  createdAt: string;
}

export interface Request {
  id: string;
  title: string;
  description: string;
  preferredFormat: 'online' | 'offline' | 'any';
  city?: string;
  budgetMinCents?: number;
  budgetMaxCents?: number;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  category: {
    slug: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface GetMyRequestsResponse {
  items: Request[];
  total: number;
}

export interface GetMyRequestsParams {
  status?: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  limit?: number;
  offset?: number;
}

// Types for specialist feed
export interface RequestFeedItem {
  id: string;
  title: string;
  description: string;
  preferredFormat: 'online' | 'offline' | 'any';
  city?: string;
  budgetMinCents?: number;
  budgetMaxCents?: number;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  category: {
    slug: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  relevanceScore?: number;
  relevanceReasons?: string[];
}

export interface GetRequestsFeedResponse {
  items: RequestFeedItem[];
  total: number;
}

export interface GetRequestsFeedParams {
  category?: string;
  format?: 'online' | 'offline' | 'any';
  city?: string;
  q?: string;
  status?: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  limit?: number;
  offset?: number;
}

// Types for applications
export interface CreateApplicationRequest {
  message: string;
}

export interface CreateApplicationResponse {
  id: string;
  status: string;
  createdAt: string;
}

export interface Application {
  id: string;
  message: string;
  status: 'sent' | 'accepted' | 'declined';
  createdAt: string;
  specialist: {
    id: string;
    displayName: string;
    bio: string;
    experienceYears: number;
    priceMinCents: number | null;
    priceMaxCents: number | null;
    onlineOnly: boolean;
    city: string | null;
    verified: boolean;
    categories: {
      slug: string;
      name: string;
    }[];
  };
}

export interface GetApplicationsResponse {
  items: Application[];
  total: number;
}

// Types for opportunities (specialist feed)
export interface OpportunityFilters {
  category?: string;
  format?: 'online' | 'offline' | 'any';
  city?: string;
  q?: string;
}

export interface ApplicationFormData {
  message: string;
}

export interface ApplicationFormErrors {
  message?: string;
  general?: string;
}

// Types for application actions
export interface AcceptApplicationResponse {
  threadId: string;
}

export interface DeclineApplicationResponse {
  success: boolean;
}

// Types for request form
export interface RequestFormData {
  categorySlug: string;
  title: string;
  description: string;
  preferredFormat: 'online' | 'offline' | 'any';
  city?: string;
  budgetMinCents?: number;
  budgetMaxCents?: number;
}

export interface RequestFormErrors {
  categorySlug?: string;
  title?: string;
  description?: string;
  preferredFormat?: string;
  city?: string;
  budgetMinCents?: string;
  budgetMaxCents?: string;
  general?: string;
}
