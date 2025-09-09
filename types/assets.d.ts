interface AssetFolderResource {
  id: string
  name: string
  description: string | null
  icon: string | null
  color: string | null
  parent_id: string | null
  children_count?: number
  assets_count?: number
  created_at: string
  updated_at: string
}

interface AssetResource {
  id: string
  filename: string
  extension: string
  mime_type: string
  size: number
  full_path: string
  folder_id: string | null
  folder?: AssetFolderResource
  metadata: Record<string, unknown>
  data: Record<string, unknown> & { focus?: { x: number; y: number } }
  tags: string[]
  url: string
  created_at: string
  updated_at: string
}

interface AssetValue {
  id: string
  type: 'asset'
  full_path: string
  extension: string
  mime_type: string
  size: number
  filename: string
  data: Record<string, unknown> & { focus?: { x: number; y: number } }
}


interface AssetTagResource {
  id: string
  name: string
  slug: string
  icon: string | null
  color: string | null
  description: string | null
  space_id: string
  assets_count?: number
  assets?: AssetResource[] | number | null
  created_at: string
  updated_at: string
}

interface UpsertAssetFolderPayload {
  name?: string
  description?: string | null
  icon?: string | null
  color?: string | null
  parent_id?: string | null
}

interface UpsertAssetTagPayload {
  name: string
  icon?: string | null
  color?: string | null
}

interface UploadAssetPayload {
  file: File
  folder_id?: string | null
  tags?: string[]
  metadata?: Record<string, unknown>
  data?: Record<string, unknown>
}

interface UpdateAssetPayload {
  folder_id?: string | null
  tags?: string[]
  metadata?: Record<string, unknown>
  data?: Record<string, unknown>
}


type AssetTypes = 'image' | 'document' | 'video' | 'audio' | 'other'

interface UploadFile extends UploadAssetPayload {
  id: string
  preview?: string
  type: AssetTypes
}