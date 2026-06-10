export type DonationPack = {
  id: string
  name: string
  total_cost: number
  monthly_amount: number
  expected_donors: number
  objective: number
  description: string | null
  is_active: boolean
  sort_order: number
  created_at: string
}

export type Profile = {
  id: string
  full_name: string | null
  phone: string | null
  city: string | null
  country: string
  affiliation: 'centrale' | 'j5' | 'diaspora' | null
  avatar_url: string | null
  is_public: boolean
  created_at: string
  updated_at: string
}

export type AdminRole = 'super_admin' | 'finance_manager' | 'communication_manager' | 'treasurer'

export type AdminUser = {
  id: string
  role: AdminRole
  full_name: string | null
  created_at: string
}

export type DonationType = 'one_time' | 'monthly'
export type PaymentMethod = 'bank_transfer' | 'cash_plus' | 'wafacash' | 'western_union' | 'moneygram' | 'direct'
export type DonationStatus = 'pending' | 'validated' | 'rejected' | 'overdue'

export type Donation = {
  id: string
  user_id: string | null
  pack_id: string | null
  amount: number
  type: DonationType
  payment_method: PaymentMethod
  status: DonationStatus
  proof_url: string | null
  notes: string | null
  admin_notes: string | null
  validated_by: string | null
  validated_at: string | null
  month_year: string | null
  created_at: string
  updated_at: string
  profiles?: Pick<Profile, 'full_name' | 'avatar_url' | 'is_public'>
  donation_packs?: Pick<DonationPack, 'name'>
}

export type ProjectProgress = {
  id: string
  total_goal: number
  total_collected: number
  active_donors: number
  total_donations_count: number
  milestone_25_at: string | null
  milestone_50_at: string | null
  milestone_75_at: string | null
  milestone_100_at: string | null
  updated_at: string
  updated_by: string | null
}

export type Testimonial = {
  id: string
  user_id: string | null
  author_name: string
  content: string
  avatar_url: string | null
  is_approved: boolean
  created_at: string
}

export type CommitmentStatus = 'active' | 'change_requested' | 'inactive'

export type DonorCommitment = {
  id: string
  user_id: string
  pack_id: string
  status: CommitmentStatus
  requested_pack_id: string | null
  change_note: string | null
  change_requested_at: string | null
  approved_by: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
  donation_packs?: Pick<DonationPack, 'id' | 'name' | 'total_cost' | 'monthly_amount' | 'description'>
}

export type NewsPost = {
  id: string
  slug: string
  title: string
  content: string
  excerpt: string | null
  cover_image_url: string | null
  is_published: boolean
  author_id: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}
