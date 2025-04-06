import { BaseResource } from './base-resource'
import type { ApiClient } from '../client'
import type { BaseQueryParams } from '~/types'


export interface AssetFoldersQueryParams extends BaseQueryParams {
  filter?: {
    parent_id?: string | null
    name?: string
  }
}

export class AssetFolders extends BaseResource<
  AssetFolderResource,
  UpsertAssetFolderPayload,
  UpsertAssetFolderPayload,
  AssetFoldersQueryParams
> {
  protected basePath: string

  constructor(client: ApiClient, spaceId: string) {
    super(client)
    this.basePath = `/mgmt/v1/spaces/${spaceId}/asset-folders`
  }
}