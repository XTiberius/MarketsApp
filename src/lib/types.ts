// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = 'investor' | 'admin'
export type KycStatus = 'pending' | 'approved' | 'rejected'
export type EntityType = 'LLC' | 'Corp' | 'Fund' | 'Trust' | 'Partnership' | 'Other'
export type ListingType = 'primary' | 'secondary'
export type ListingStatus = 'draft' | 'published' | 'closed'
export type BidStatus = 'placed' | 'accepted' | 'awaiting_payment' | 'invested' | 'rejected'
export type DocumentType = 'investment_agreement' | 'k1' | 'reg_d' | 'other'

// ─── Database Row Types ───────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: UserRole
  kyc_status: KycStatus
  created_at: string
}

export interface KycIndividual {
  id: string
  user_id: string
  first_name: string
  last_name: string
  dob: string
  address: string
  phone: string
  occupation: string
  accredited_investor: boolean
  submitted_at: string | null
  reviewed_at: string | null
  admin_notes: string | null
}

export interface KycEntity {
  id: string
  user_id: string
  entity_name: string
  entity_type: EntityType
  ein: string
  address: string
  phone: string
  owner_info: { name: string; title: string }
  signatory_info: { name: string; title: string }
  accredited_investor: boolean
  submitted_at: string | null
  reviewed_at: string | null
  admin_notes: string | null
}

export interface Listing {
  id: string
  admin_id: string
  company_name: string
  logo_url: string | null
  description: string
  // Fields hidden until NDA is signed
  valuation: number | null
  amount_raised: number | null
  investment_structure: string | null
  nda_text: string
  listing_type: ListingType
  industry: string
  status: ListingStatus
  created_at: string
  updated_at: string
}

// Public-safe listing (valuation/financials omitted)
export type ListingPublic = Omit<Listing, 'valuation' | 'amount_raised' | 'investment_structure' | 'nda_text'>

export interface Bid {
  id: string
  investor_id: string
  listing_id: string
  amount: number
  status: BidStatus
  nda_signed: boolean
  nda_signed_at: string | null
  created_at: string
  updated_at: string
}

export interface AssociatedDocument {
  id: string
  bid_id: string
  file_name: string
  file_url: string
  document_type: DocumentType
  uploaded_by: string
  uploaded_at: string
}

export interface NdaSignature {
  id: string
  bid_id: string
  signature_image_url: string
  signed_at: string
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiError {
  error: string
  status?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
}
