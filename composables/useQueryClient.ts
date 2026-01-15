export const queryKeys = {
  spaces: {
    all: () => ['spaces'] as const,
    lists: () => [...queryKeys.spaces.all(), 'list'] as const,
    list: (filters: any = {}) => [...queryKeys.spaces.lists(), filters] as const,
    details: () => [...queryKeys.spaces.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.spaces.details(), id] as const,
  },
  assetFolders: (spaceId: string) => ({
    all: () => ['spaces', spaceId, 'asset-folders'] as const,
    lists: () => [...queryKeys.assetFolders(spaceId).all(), 'list'] as const,
    list: (filters: any = {}) => [...queryKeys.assetFolders(spaceId).lists(), filters] as const,
    details: () => [...queryKeys.assetFolders(spaceId).all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.assetFolders(spaceId).details(), id] as const,
  }),
  blockFolders: (spaceId: string) => ({
    all: () => ['spaces', spaceId, 'block-folders'] as const,
    lists: () => [...queryKeys.blockFolders(spaceId).all(), 'list'] as const,
    list: (filters: any = {}) => [...queryKeys.blockFolders(spaceId).lists(), filters] as const,
    details: () => [...queryKeys.blockFolders(spaceId).all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.blockFolders(spaceId).details(), id] as const,
  }),
  blockTags: (spaceId: string) => ({
    all: () => ['spaces', spaceId, 'block-tags'] as const,
    lists: () => [...queryKeys.blockTags(spaceId).all(), 'list'] as const,
    list: (filters: any = {}) => [...queryKeys.blockTags(spaceId).lists(), filters] as const,
    details: () => [...queryKeys.blockTags(spaceId).all(), 'detail'] as const,
    detail: (tagName: string) => [...queryKeys.blockTags(spaceId).details(), tagName] as const,
  }),
  assetTags: (spaceId: string) => ({
    all: () => ['spaces', spaceId, 'asset-tags'] as const,
    lists: () => [...queryKeys.assetTags(spaceId).all(), 'list'] as const,
    list: (filters: any = {}) => [...queryKeys.assetTags(spaceId).lists(), filters] as const,
    details: () => [...queryKeys.assetTags(spaceId).all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.assetTags(spaceId).details(), id] as const,
  }),
  tokens: (spaceId: string) => ({
    all: () => ['spaces', spaceId, 'tokens'] as const,
    lists: () => [...queryKeys.assetTags(spaceId).all(), 'list'] as const,
    list: (filters: any = {}) => [...queryKeys.assetTags(spaceId).lists(), filters] as const,
  }),
  teams: {
    all: () => ['teams'] as const,
    lists: () => [...queryKeys.teams.all(), 'list'] as const,
    list: (filters: any = {}) => [...queryKeys.teams.lists(), filters] as const,
    details: () => [...queryKeys.teams.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.teams.details(), id] as const,
    hierarchy: () => [...queryKeys.teams.all(), 'hierarchy'] as const,
    users: (teamId: string) => ({
      all: () => [...queryKeys.teams.detail(teamId), 'users'] as const,
      lists: () => [...queryKeys.teams.users(teamId).all(), 'list'] as const,
      list: (filters: any = {}) => [...queryKeys.teams.users(teamId).lists(), filters] as const,
    }),
  },
  redirects: (spaceId: string) => ({
    all: () => ['spaces', spaceId, 'redirects'] as const,
    lists: () => [...queryKeys.redirects(spaceId).all(), 'list'] as const,
    list: (filters: any = {}) => [...queryKeys.redirects(spaceId).lists(), filters] as const,
    details: () => [...queryKeys.redirects(spaceId).all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.redirects(spaceId).details(), id] as const,
  }),
  assets: (spaceId: string) => ({
    all: () => ['spaces', spaceId, 'assets'] as const,
    lists: () => [...queryKeys.assets(spaceId).all(), 'list'] as const,
    list: (filters: any = {}) => [...queryKeys.assets(spaceId).lists(), filters] as const,
    details: () => [...queryKeys.assets(spaceId).all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.assets(spaceId).details(), id] as const,
  }),
  blocks: (spaceId: string) => ({
    all: () => ['spaces', spaceId, 'blocks'] as const,
    lists: () => [...queryKeys.blocks(spaceId).all(), 'list'] as const,
    list: (filters: any = {}) => [...queryKeys.blocks(spaceId).lists(), filters] as const,
    details: () => [...queryKeys.blocks(spaceId).all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.blocks(spaceId).details(), id] as const,
  }),
  contents: (spaceId: string) => ({
    all: () => ['spaces', spaceId, 'contents'] as const,
    lists: () => [...queryKeys.contents(spaceId).all(), 'list'] as const,
    list: (filters: any = {}) => [...queryKeys.contents(spaceId).lists(), filters] as const,
    details: () => [...queryKeys.contents(spaceId).all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.contents(spaceId).details(), id] as const,
  }),
  contentVersions: (spaceId: string, contentId: string) => ({
    all: () => ['spaces', spaceId, 'contents', contentId, 'history'] as const,
    lists: () => [...queryKeys.contentVersions(spaceId, contentId).all(), 'list'] as const,
    list: (filters: any = {}) =>
      [...queryKeys.contentVersions(spaceId, contentId).lists(), filters] as const,
    details: () => [...queryKeys.contentVersions(spaceId, contentId).all(), 'detail'] as const,
    detail: (id: string) =>
      [...queryKeys.contentVersions(spaceId, contentId).details(), id] as const,
  }),
  contentMenu: (spaceId: string) => ({
    all: () => ['spaces', spaceId, 'content-menu'] as const,
  }),
  // Add data sources and entries query keys
  dataSources: (spaceId: string) => ({
    all: () => ['spaces', spaceId, 'data-sources'] as const,
    lists: () => [...queryKeys.dataSources(spaceId).all(), 'list'] as const,
    list: (filters: any = {}) => [...queryKeys.dataSources(spaceId).lists(), filters] as const,
    details: () => [...queryKeys.dataSources(spaceId).all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.dataSources(spaceId).details(), id] as const,
  }),
  dataEntries: (spaceId: string, dataSourceId: string) => ({
    all: () => ['spaces', spaceId, 'data-sources', dataSourceId, 'entries'] as const,
    lists: () => [...queryKeys.dataEntries(spaceId, dataSourceId).all(), 'list'] as const,
    list: (filters: any = {}) =>
      [...queryKeys.dataEntries(spaceId, dataSourceId).lists(), filters] as const,
    details: () => [...queryKeys.dataEntries(spaceId, dataSourceId).all(), 'detail'] as const,
    detail: (id: string) =>
      [...queryKeys.dataEntries(spaceId, dataSourceId).details(), id] as const,
  }),
}
