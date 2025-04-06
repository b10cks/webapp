import type { BaseQueryParams } from '~/types'
import { BaseResource } from './base-resource'
import type { ApiClient } from '../client'

export interface AssetTagsQueryParams extends BaseQueryParams {
  q?: string
  icon?: string
  color?: string
  name?: string
}

export class AssetTags extends BaseResource<
  AssetTagResource,
  UpsertAssetTagPayload,
  UpsertAssetTagPayload,
  AssetTagsQueryParams
> {
  protected basePath: string

  constructor(client: ApiClient, spaceId: string) {
    super(client)
    this.basePath = `/mgmt/v1/spaces/${spaceId}/asset-tags`
  }
}