export interface CatalogItem { id: number; name: string; description: string; createdAt: string }
export type CatalogInput = Pick<CatalogItem, 'name' | 'description'>
