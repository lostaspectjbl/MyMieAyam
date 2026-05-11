export type Warung = {
  id: string
  nama: string
  alamat: string
  deskripsi: string | null
  maps_embed: string | null
  created_at: string
}

export type WarungWithRating = Warung & {
  avg_rating: number
  total_reviews: number
  foto_thumbnail: string | null
}

export type WarungFoto = {
  id: string
  warung_id: string
  foto_url: string
  urutan: number
  created_at: string
}

export type Review = {
  id: string
  warung_id: string
  user_id: string
  rating: number
  komentar: string | null
  created_at: string
}

export type ReviewWithProfile = Review & {
  profiles: {
    username: string | null
    avatar_url: string | null
  }
}

export type Favorit = {
  id: string
  warung_id: string
  user_id: string
  created_at: string
}

export type Profile = {
  id: string
  username: string | null
  avatar_url: string | null
  is_admin: boolean
  created_at: string
}
