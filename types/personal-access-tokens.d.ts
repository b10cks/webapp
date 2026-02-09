type PersonalAccessToken = {
  id: number
  name: string
  created_at: string
  expires_at: string | null
}

type PersonalAccessTokenListResponse = {
  data: PersonalAccessToken[]
  links: {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
  }
  meta: {
    current_page: number
    from: number | null
    last_page: number
    path: string
    per_page: number
    to: number | null
    total: number
  }
}

type PersonalAccessTokenCreateResponse = {
  token: PersonalAccessToken
  plain_text_token: string
}
