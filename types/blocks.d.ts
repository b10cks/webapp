interface Schema {
  name: string
  description: string
  required: boolean
  order: number
  default: string | undefined
}

interface BlocksSchema extends Schema {
  type: 'blocks'
  restrict_blocks: boolean
  block_whitelist: string[]
  restrict_tags: boolean
  tag_whitelist: string[]
}

interface LinkSchema extends Schema {
  type: 'link'
  translatable: boolean
  asset_link_type: boolean
  email_link_type: boolean
  allow_target_blank: boolean
}

type FileTypes = 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other' | 'all'

interface AssetSchema extends Schema {
  type: 'asset'
  file_types: FileTypes[]
  folder_id: string | null
}

interface MultiAssetSchema extends Schema {
  type: 'multi_assets'
  file_types: FileTypes[]
  min: number
  max: number
}

interface ReferencesSchema extends Schema {
  type: 'references'
  block_whitelist: string[]
  min: number
  max: number
}

interface TextSchema extends Schema {
  type: 'text'
  translatable: boolean
}

interface TextareaSchema extends Schema {
  type: 'textarea'
  translatable: boolean
}

interface MarkdownSchema extends Schema {
  type: 'markdown'
  translatable: boolean
}

interface NumberSchema extends Schema {
  type: 'number'
}

interface BooleanSchema extends Schema {
  type: 'boolean'
  show_inline: boolean
}

interface OptionItem {
  name: string
  value: string
}

interface OptionSchema extends Schema {
  type: 'option'
  options: OptionItem[],
  exclude_empty: boolean
}

type TranslatableSchema = TextSchema | TextareaSchema | MarkdownSchema | LinkSchema
type SchemaType = BlocksSchema | LinkSchema | TextSchema | TextareaSchema | MarkdownSchema | NumberSchema | BooleanSchema | OptionSchema | AssetSchema | MultiAssetsSchema | ReferencesSchema

interface EditorPage {
  header: string
  items: string[]
}

interface BlockResource {
  id: string
  slug: string
  icon?: string | null
  color?: string | null
  name: string
  description: string
  type: 'root' | 'nestable' | 'single' | 'universal'
  preview_template?: string
  schema: Record<string, SchemaType>
  editor: EditorPage[]
  tags: string[]
  folder_id: string | null
  created_at: string
  updated_at: string
}

interface CreateBlockPayload {
  icon?: string | null
  color?: string | null
  name: string
  description?: string | null
  type: 'root' | 'nestable' | 'single' | 'universal'
  schema?: Record<string, SchemaType>
  tags: string[]
  folder_id: string | null
}

interface UpdateBlockPayload {
  icon?: string | null
  color?: string | null
  name?: string
  description?: string | null
  type: 'root' | 'nestable' | 'single' | 'universal'
  schema?: Record<string, SchemaType>
  tags: string[]
  folder_id: string | null
}