// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = 'investor' | 'admin'
export type KycStatus = 'pending' | 'approved' | 'rejected'
export type EntityType = 'LLC' | 'Corp' | 'Fund' | 'Trust' | 'Partnership' | 'Other'
export type ListingType = 'primary' | 'secondary'
export type ListingStatus = 'draft' | 'published' | 'closed'
export type BidStatus =
  | 'placed'
  | 'pending_acceptance'
  | 'accepted'
  | 'documents_executed'
  | 'awaiting_payment'
  | 'invested'
  | 'rejected'
export type DocumentType =
  | 'investment_agreement'
  | 'k1'
  | 'reg_d'
  | 'other'
  | 'nii'
  | 'investment_doc'
  | 'payment_instructions'
  | 'filing'
export type ListingDocType = 'memorandum' | 'pitch_deck' | 'other'
export type PortfolioStatus = 'active' | 'closed'

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
  minimum_investment: number | null
  investment_structure: string | null
  nda_text: string
  listing_type: ListingType
  industry: string
  status: ListingStatus
  ai_newsfeed_enabled: boolean
  created_at: string
  updated_at: string
}

// Public-safe listing (valuation/financials omitted)
export type ListingPublic = Omit<
  Listing,
  'valuation' | 'amount_raised' | 'minimum_investment' | 'investment_structure' | 'nda_text'
>

export interface Bid {
  id: string
  investor_id: string
  listing_id: string
  amount: number
  status: BidStatus
  payment_confirmation: string | null
  invested_at: string | null
  portfolio_status: PortfolioStatus | null
  invested_principal: number | null
  returned_principal: number | null
  closed_at: string | null
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
  storage_path: string | null
  document_type: DocumentType
  uploaded_by: string
  uploaded_at: string
}

export interface NdaSignature {
  id: string
  investor_id: string
  listing_id: string
  signature_image_url: string
  signed_at: string
}

export interface ListingDocument {
  id: string
  listing_id: string
  doc_type: ListingDocType
  file_name: string
  storage_path: string
  uploaded_by: string
  created_at: string
}

export interface FundingRound {
  id: string
  listing_id: string
  round_name: string
  valuation: number
  event_date: string | null
  sequence_order: number
  created_at: string
}

export interface NewsfeedBullet {
  text: string
}

export interface ListingNewsfeed {
  id: string
  listing_id: string
  bullets: NewsfeedBullet[]
  disclosure: string
  generated_at: string
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
