import { z } from 'zod';
import { prisma } from './database';
import { ValidationError } from '../utils/errors';

export interface ContentLibraryItem {
  id: string;
  organizationId: string;
  type: 'content_piece' | 'template' | 'asset' | 'campaign' | 'series' | 'idea';
  title: string;
  description?: string;
  content?: {
    body?: string;
    platform?: string;
    contentType?: string;
    hashtags?: string[];
    mentions?: string[];
    mediaRefs?: any;
  };
  metadata: {
    author: string;
    authorId: string;
    version: number;
    status: 'draft' | 'approved' | 'published' | 'archived' | 'template';
    platform?: string;
    contentType?: string;
    pillarId?: string;
    seriesId?: string;
    campaignId?: string;
    performance?: {
      impressions?: number;
      engagement?: number;
      clicks?: number;
      conversions?: number;
      score?: number; // overall performance score
    };
    usage?: {
      timesUsed: number;
      lastUsed?: Date;
      copiedCount: number;
      sharedCount: number;
    };
    ai?: {
      generated: boolean;
      generatedBy?: string;
      confidence?: number;
      variations?: number;
    };
  };
  tags: string[];
  categories: string[];
  collections: string[]; // user-created collections
  permissions: {
    isPublic: boolean;
    sharedWith: string[]; // user/role IDs
    canEdit: string[];
    canView: string[];
  };
  searchableContent: string; // concatenated content for full-text search
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentCollection {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  ownerId: string;
  itemIds: string[];
  tags: string[];
  isPublic: boolean;
  sharedWith: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentSearchFilters {
  query?: string;
  type?: string[];
  status?: string[];
  platform?: string[];
  contentType?: string[];
  tags?: string[];
  categories?: string[];
  collections?: string[];
  author?: string[];
  pillar?: string[];
  series?: string[];
  campaign?: string[];
  dateRange?: {
    start?: Date;
    end?: Date;
    field?: 'created' | 'updated' | 'published';
  };
  performance?: {
    minEngagement?: number;
    minImpressions?: number;
    minScore?: number;
  };
  aiGenerated?: boolean;
  hasMedia?: boolean;
  sortBy?: 'created' | 'updated' | 'title' | 'performance' | 'usage' | 'relevance';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ContentSearchResult {
  items: ContentLibraryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  facets: {
    types: Array<{ value: string; count: number }>;
    platforms: Array<{ value: string; count: number }>;
    tags: Array<{ value: string; count: number }>;
    authors: Array<{ value: string; count: number }>;
    statuses: Array<{ value: string; count: number }>;
  };
  suggestions?: string[];
}

export interface ContentAnalytics {
  totalItems: number;
  itemsByType: Record<string, number>;
  itemsByStatus: Record<string, number>;
  itemsByPlatform: Record<string, number>;
  topTags: Array<{ tag: string; count: number }>;
  topAuthors: Array<{ author: string; count: number }>;
  performanceMetrics: {
    averageEngagement: number;
    topPerformingItems: ContentLibraryItem[];
    underperformingItems: ContentLibraryItem[];
  };
  usageMetrics: {
    mostUsedItems: ContentLibraryItem[];
    recentlyUpdated: ContentLibraryItem[];
    staleContent: ContentLibraryItem[];
  };
  growth: {
    itemsCreatedLastWeek: number;
    itemsCreatedLastMonth: number;
    growthRate: number;
  };
}

const CreateLibraryItemSchema = z.object({
  organizationId: z.string(),
  type: z.enum(['content_piece', 'template', 'asset', 'campaign', 'series', 'idea']),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  content: z.object({
    body: z.string().optional(),
    platform: z.string().optional(),
    contentType: z.string().optional(),
    hashtags: z.array(z.string()).optional(),
    mentions: z.array(z.string()).optional(),
    mediaRefs: z.any().optional(),
  }).optional(),
  metadata: z.object({
    author: z.string(),
    authorId: z.string(),
    status: z.enum(['draft', 'approved', 'published', 'archived', 'template']).default('draft'),
    platform: z.string().optional(),
    contentType: z.string().optional(),
    pillarId: z.string().optional(),
    seriesId: z.string().optional(),
    campaignId: z.string().optional(),
  }),
  tags: z.array(z.string()).default([]),
  categories: z.array(z.string()).default([]),
  collections: z.array(z.string()).default([]),
  permissions: z.object({
    isPublic: z.boolean().default(false),
    sharedWith: z.array(z.string()).default([]),
    canEdit: z.array(z.string()).default([]),
    canView: z.array(z.string()).default([]),
  }).default({}),
});

const UpdateLibraryItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  content: z.object({
    body: z.string().optional(),
    platform: z.string().optional(),
    contentType: z.string().optional(),
    hashtags: z.array(z.string()).optional(),
    mentions: z.array(z.string()).optional(),
    mediaRefs: z.any().optional(),
  }).optional(),
  tags: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  collections: z.array(z.string()).optional(),
  permissions: z.object({
    isPublic: z.boolean().optional(),
    sharedWith: z.array(z.string()).optional(),
    canEdit: z.array(z.string()).optional(),
    canView: z.array(z.string()).optional(),
  }).optional(),
  metadata: z.object({
    status: z.enum(['draft', 'approved', 'published', 'archived', 'template']).optional(),
    platform: z.string().optional(),
    contentType: z.string().optional(),
    pillarId: z.string().optional(),
    seriesId: z.string().optional(),
    campaignId: z.string().optional(),
  }).optional(),
});

const CreateCollectionSchema = z.object({
  organizationId: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  ownerId: z.string(),
  tags: z.array(z.string()).default([]),
  isPublic: z.boolean().default(false),
  sharedWith: z.array(z.string()).default([]),
});

const SearchFiltersSchema = z.object({
  query: z.string().optional(),
  type: z.array(z.string()).optional(),
  status: z.array(z.string()).optional(),
  platform: z.array(z.string()).optional(),
  contentType: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  collections: z.array(z.string()).optional(),
  author: z.array(z.string()).optional(),
  pillar: z.array(z.string()).optional(),
  series: z.array(z.string()).optional(),
  campaign: z.array(z.string()).optional(),
  dateRange: z.object({
    start: z.date().optional(),
    end: z.date().optional(),
    field: z.enum(['created', 'updated', 'published']).default('created'),
  }).optional(),
  performance: z.object({
    minEngagement: z.number().optional(),
    minImpressions: z.number().optional(),
    minScore: z.number().optional(),
  }).optional(),
  aiGenerated: z.boolean().optional(),
  hasMedia: z.boolean().optional(),
  sortBy: z.enum(['created', 'updated', 'title', 'performance', 'usage', 'relevance']).default('created'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export class ContentLibraryService {
  constructor() {}

  async createItem(itemData: z.infer<typeof CreateLibraryItemSchema>): Promise<ContentLibraryItem> {
    try {
      const validatedData = CreateLibraryItemSchema.parse(itemData);

      const item: ContentLibraryItem = {
        id: `lib_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...validatedData,
        metadata: {
          ...validatedData.metadata,
          version: 1,
          usage: {
            timesUsed: 0,
            copiedCount: 0,
            sharedCount: 0,
          },
        },
        searchableContent: this.buildSearchableContent(validatedData),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // In real implementation: save to database
      // await prisma.contentLibraryItem.create({ data: item });

      return item;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid library item data', 'itemData', error.errors);
      }
      throw error;
    }
  }

  async updateItem(updateData: z.infer<typeof UpdateLibraryItemSchema>): Promise<ContentLibraryItem> {
    try {
      const validatedData = UpdateLibraryItemSchema.parse(updateData);

      // Get existing item
      const existingItem = await this.getItemById(validatedData.id);
      if (!existingItem) {
        throw new ValidationError('Library item not found', 'id', validatedData.id);
      }

      // Update item
      const updatedItem: ContentLibraryItem = {
        ...existingItem,
        ...validatedData,
        metadata: {
          ...existingItem.metadata,
          ...validatedData.metadata,
          version: existingItem.metadata.version + 1,
        },
        searchableContent: this.buildSearchableContent({
          ...existingItem,
          ...validatedData,
        }),
        updatedAt: new Date(),
      };

      // In real implementation: update database
      // await prisma.contentLibraryItem.update({ where: { id: validatedData.id }, data: updatedItem });

      return updatedItem;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid update data', 'updateData', error.errors);
      }
      throw error;
    }
  }

  async searchItems(filters: ContentSearchFilters): Promise<ContentSearchResult> {
    try {
      const validatedFilters = SearchFiltersSchema.parse(filters);

      // Mock implementation - in real implementation, use database with full-text search
      const allItems = await this.getAllItems(validatedFilters.organizationId || '');
      
      let filteredItems = this.applyFilters(allItems, validatedFilters);
      
      // Apply sorting
      filteredItems = this.sortItems(filteredItems, validatedFilters.sortBy, validatedFilters.sortOrder);

      // Apply pagination
      const total = filteredItems.length;
      const startIndex = (validatedFilters.page - 1) * validatedFilters.limit;
      const paginatedItems = filteredItems.slice(startIndex, startIndex + validatedFilters.limit);

      // Generate facets
      const facets = this.generateFacets(allItems);

      // Generate search suggestions
      const suggestions = validatedFilters.query ? this.generateSearchSuggestions(validatedFilters.query, allItems) : undefined;

      return {
        items: paginatedItems,
        pagination: {
          page: validatedFilters.page,
          limit: validatedFilters.limit,
          total,
          totalPages: Math.ceil(total / validatedFilters.limit),
        },
        facets,
        suggestions,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid search filters', 'filters', error.errors);
      }
      throw error;
    }
  }

  async getItemById(id: string): Promise<ContentLibraryItem | null> {
    // In real implementation: fetch from database
    // return await prisma.contentLibraryItem.findUnique({ where: { id } });
    return null; // Mock implementation
  }

  async deleteItem(id: string, organizationId: string): Promise<boolean> {
    const item = await this.getItemById(id);
    if (!item) {
      throw new ValidationError('Library item not found', 'id', id);
    }

    if (item.organizationId !== organizationId) {
      throw new ValidationError('Access denied', 'organizationId', 'Item belongs to different organization');
    }

    // In real implementation: delete from database
    // await prisma.contentLibraryItem.delete({ where: { id } });
    
    return true;
  }

  async duplicateItem(id: string, organizationId: string, customizations?: {
    title?: string;
    description?: string;
    collections?: string[];
  }): Promise<ContentLibraryItem> {
    const originalItem = await this.getItemById(id);
    if (!originalItem) {
      throw new ValidationError('Library item not found', 'id', id);
    }

    const duplicatedItem: ContentLibraryItem = {
      ...originalItem,
      id: `lib_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: customizations?.title || `${originalItem.title} (Copy)`,
      description: customizations?.description || originalItem.description,
      collections: customizations?.collections || [],
      metadata: {
        ...originalItem.metadata,
        version: 1,
        usage: {
          timesUsed: 0,
          copiedCount: 0,
          sharedCount: 0,
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    duplicatedItem.searchableContent = this.buildSearchableContent(duplicatedItem);

    // In real implementation: save to database
    // await prisma.contentLibraryItem.create({ data: duplicatedItem });

    return duplicatedItem;
  }

  async createCollection(collectionData: z.infer<typeof CreateCollectionSchema>): Promise<ContentCollection> {
    try {
      const validatedData = CreateCollectionSchema.parse(collectionData);

      const collection: ContentCollection = {
        id: `col_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...validatedData,
        itemIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // In real implementation: save to database
      // await prisma.contentCollection.create({ data: collection });

      return collection;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid collection data', 'collectionData', error.errors);
      }
      throw error;
    }
  }

  async addItemToCollection(itemId: string, collectionId: string, organizationId: string): Promise<boolean> {
    // Validate item and collection exist and belong to organization
    const item = await this.getItemById(itemId);
    const collection = await this.getCollectionById(collectionId);

    if (!item || item.organizationId !== organizationId) {
      throw new ValidationError('Item not found or access denied', 'itemId', itemId);
    }

    if (!collection || collection.organizationId !== organizationId) {
      throw new ValidationError('Collection not found or access denied', 'collectionId', collectionId);
    }

    // Add item to collection
    if (!collection.itemIds.includes(itemId)) {
      collection.itemIds.push(itemId);
      collection.updatedAt = new Date();

      // Also add collection to item
      if (!item.collections.includes(collectionId)) {
        item.collections.push(collectionId);
        item.updatedAt = new Date();
      }

      // In real implementation: update database
      // await prisma.contentCollection.update({ where: { id: collectionId }, data: collection });
      // await prisma.contentLibraryItem.update({ where: { id: itemId }, data: item });
    }

    return true;
  }

  async removeItemFromCollection(itemId: string, collectionId: string, organizationId: string): Promise<boolean> {
    const item = await this.getItemById(itemId);
    const collection = await this.getCollectionById(collectionId);

    if (!item || item.organizationId !== organizationId) {
      throw new ValidationError('Item not found or access denied', 'itemId', itemId);
    }

    if (!collection || collection.organizationId !== organizationId) {
      throw new ValidationError('Collection not found or access denied', 'collectionId', collectionId);
    }

    // Remove item from collection
    collection.itemIds = collection.itemIds.filter(id => id !== itemId);
    collection.updatedAt = new Date();

    // Remove collection from item
    item.collections = item.collections.filter(id => id !== collectionId);
    item.updatedAt = new Date();

    // In real implementation: update database

    return true;
  }

  async getCollectionById(id: string): Promise<ContentCollection | null> {
    // In real implementation: fetch from database
    return null;
  }

  async getCollections(organizationId: string, ownerId?: string): Promise<ContentCollection[]> {
    // In real implementation: fetch from database with filters
    return [];
  }

  async getAnalytics(organizationId: string, dateRange?: { start: Date; end: Date }): Promise<ContentAnalytics> {
    const items = await this.getAllItems(organizationId);
    
    // Filter by date range if provided
    const filteredItems = dateRange 
      ? items.filter(item => 
          item.createdAt >= dateRange.start && item.createdAt <= dateRange.end
        )
      : items;

    const analytics: ContentAnalytics = {
      totalItems: filteredItems.length,
      itemsByType: this.groupBy(filteredItems, 'type'),
      itemsByStatus: this.groupBy(filteredItems, item => item.metadata.status),
      itemsByPlatform: this.groupBy(
        filteredItems.filter(item => item.metadata.platform),
        item => item.metadata.platform!
      ),
      topTags: this.getTopTags(filteredItems, 10),
      topAuthors: this.getTopAuthors(filteredItems, 10),
      performanceMetrics: {
        averageEngagement: this.calculateAverageEngagement(filteredItems),
        topPerformingItems: this.getTopPerformingItems(filteredItems, 5),
        underperformingItems: this.getUnderperformingItems(filteredItems, 5),
      },
      usageMetrics: {
        mostUsedItems: this.getMostUsedItems(filteredItems, 5),
        recentlyUpdated: this.getRecentlyUpdatedItems(filteredItems, 5),
        staleContent: this.getStaleContent(filteredItems, 30), // 30 days
      },
      growth: this.calculateGrowthMetrics(items),
    };

    return analytics;
  }

  async updateUsageMetrics(itemId: string, action: 'used' | 'copied' | 'shared'): Promise<boolean> {
    const item = await this.getItemById(itemId);
    if (!item) {
      throw new ValidationError('Library item not found', 'itemId', itemId);
    }

    if (!item.metadata.usage) {
      item.metadata.usage = { timesUsed: 0, copiedCount: 0, sharedCount: 0 };
    }

    switch (action) {
      case 'used':
        item.metadata.usage.timesUsed++;
        item.metadata.usage.lastUsed = new Date();
        break;
      case 'copied':
        item.metadata.usage.copiedCount++;
        break;
      case 'shared':
        item.metadata.usage.sharedCount++;
        break;
    }

    item.updatedAt = new Date();

    // In real implementation: update database
    // await prisma.contentLibraryItem.update({ where: { id: itemId }, data: item });

    return true;
  }

  private async getAllItems(organizationId: string): Promise<ContentLibraryItem[]> {
    // Mock implementation - in real implementation, fetch from database
    return [];
  }

  private buildSearchableContent(item: any): string {
    const parts = [
      item.title,
      item.description,
      item.content?.body,
      ...(item.tags || []),
      ...(item.categories || []),
      ...(item.content?.hashtags || []),
      item.metadata?.author,
    ];

    return parts
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private applyFilters(items: ContentLibraryItem[], filters: ContentSearchFilters): ContentLibraryItem[] {
    return items.filter(item => {
      // Query filter (full-text search)
      if (filters.query) {
        const query = filters.query.toLowerCase();
        if (!item.searchableContent.includes(query) && 
            !item.title.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Type filter
      if (filters.type && filters.type.length > 0) {
        if (!filters.type.includes(item.type)) return false;
      }

      // Status filter
      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(item.metadata.status)) return false;
      }

      // Platform filter
      if (filters.platform && filters.platform.length > 0) {
        if (!item.metadata.platform || !filters.platform.includes(item.metadata.platform)) return false;
      }

      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        if (!filters.tags.some(tag => item.tags.includes(tag))) return false;
      }

      // Author filter
      if (filters.author && filters.author.length > 0) {
        if (!filters.author.includes(item.metadata.authorId)) return false;
      }

      // Date range filter
      if (filters.dateRange) {
        const dateField = filters.dateRange.field === 'updated' ? item.updatedAt : item.createdAt;
        if (filters.dateRange.start && dateField < filters.dateRange.start) return false;
        if (filters.dateRange.end && dateField > filters.dateRange.end) return false;
      }

      // Performance filter
      if (filters.performance) {
        const performance = item.metadata.performance;
        if (!performance) return false;
        
        if (filters.performance.minEngagement && 
            (!performance.engagement || performance.engagement < filters.performance.minEngagement)) {
          return false;
        }
        
        if (filters.performance.minImpressions && 
            (!performance.impressions || performance.impressions < filters.performance.minImpressions)) {
          return false;
        }
      }

      // AI generated filter
      if (filters.aiGenerated !== undefined) {
        const isAiGenerated = item.metadata.ai?.generated || false;
        if (filters.aiGenerated !== isAiGenerated) return false;
      }

      // Has media filter
      if (filters.hasMedia !== undefined) {
        const hasMedia = !!(item.content?.mediaRefs);
        if (filters.hasMedia !== hasMedia) return false;
      }

      return true;
    });
  }

  private sortItems(items: ContentLibraryItem[], sortBy: string, sortOrder: 'asc' | 'desc'): ContentLibraryItem[] {
    const multiplier = sortOrder === 'asc' ? 1 : -1;

    return items.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'created':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'updated':
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
        case 'performance':
          const aScore = a.metadata.performance?.score || 0;
          const bScore = b.metadata.performance?.score || 0;
          comparison = aScore - bScore;
          break;
        case 'usage':
          const aUsage = a.metadata.usage?.timesUsed || 0;
          const bUsage = b.metadata.usage?.timesUsed || 0;
          comparison = aUsage - bUsage;
          break;
        default:
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
      }

      return comparison * multiplier;
    });
  }

  private generateFacets(items: ContentLibraryItem[]): ContentSearchResult['facets'] {
    return {
      types: this.generateFacetCounts(items, 'type'),
      platforms: this.generateFacetCounts(items, item => item.metadata.platform).filter(f => f.value),
      tags: this.getTopTags(items, 20).map(t => ({ value: t.tag, count: t.count })),
      authors: this.getTopAuthors(items, 10).map(a => ({ value: a.author, count: a.count })),
      statuses: this.generateFacetCounts(items, item => item.metadata.status),
    };
  }

  private generateFacetCounts<T>(items: ContentLibraryItem[], accessor: string | ((item: ContentLibraryItem) => T)): Array<{ value: string; count: number }> {
    const counts: Record<string, number> = {};
    
    items.forEach(item => {
      const value = typeof accessor === 'string' ? item[accessor as keyof ContentLibraryItem] : accessor(item);
      const stringValue = String(value);
      if (stringValue && stringValue !== 'undefined') {
        counts[stringValue] = (counts[stringValue] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);
  }

  private generateSearchSuggestions(query: string, items: ContentLibraryItem[]): string[] {
    // Simple implementation - in practice, would use more sophisticated matching
    const suggestions = new Set<string>();
    const queryLower = query.toLowerCase();

    items.forEach(item => {
      // Add title suggestions
      if (item.title.toLowerCase().includes(queryLower)) {
        suggestions.add(item.title);
      }

      // Add tag suggestions
      item.tags.forEach(tag => {
        if (tag.toLowerCase().includes(queryLower)) {
          suggestions.add(tag);
        }
      });
    });

    return Array.from(suggestions).slice(0, 5);
  }

  private groupBy<T>(items: T[], accessor: string | ((item: T) => string)): Record<string, number> {
    const groups: Record<string, number> = {};
    
    items.forEach(item => {
      const key = typeof accessor === 'string' ? String(item[accessor as keyof T]) : accessor(item);
      groups[key] = (groups[key] || 0) + 1;
    });

    return groups;
  }

  private getTopTags(items: ContentLibraryItem[], limit: number): Array<{ tag: string; count: number }> {
    const tagCounts: Record<string, number> = {};
    
    items.forEach(item => {
      item.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  private getTopAuthors(items: ContentLibraryItem[], limit: number): Array<{ author: string; count: number }> {
    const authorCounts: Record<string, number> = {};
    
    items.forEach(item => {
      const author = item.metadata.author;
      authorCounts[author] = (authorCounts[author] || 0) + 1;
    });

    return Object.entries(authorCounts)
      .map(([author, count]) => ({ author, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  private calculateAverageEngagement(items: ContentLibraryItem[]): number {
    const itemsWithEngagement = items.filter(item => item.metadata.performance?.engagement);
    if (itemsWithEngagement.length === 0) return 0;

    const total = itemsWithEngagement.reduce((sum, item) => 
      sum + (item.metadata.performance?.engagement || 0), 0
    );
    
    return total / itemsWithEngagement.length;
  }

  private getTopPerformingItems(items: ContentLibraryItem[], limit: number): ContentLibraryItem[] {
    return items
      .filter(item => item.metadata.performance?.score)
      .sort((a, b) => (b.metadata.performance?.score || 0) - (a.metadata.performance?.score || 0))
      .slice(0, limit);
  }

  private getUnderperformingItems(items: ContentLibraryItem[], limit: number): ContentLibraryItem[] {
    return items
      .filter(item => item.metadata.performance?.score)
      .sort((a, b) => (a.metadata.performance?.score || 0) - (b.metadata.performance?.score || 0))
      .slice(0, limit);
  }

  private getMostUsedItems(items: ContentLibraryItem[], limit: number): ContentLibraryItem[] {
    return items
      .filter(item => item.metadata.usage?.timesUsed)
      .sort((a, b) => (b.metadata.usage?.timesUsed || 0) - (a.metadata.usage?.timesUsed || 0))
      .slice(0, limit);
  }

  private getRecentlyUpdatedItems(items: ContentLibraryItem[], limit: number): ContentLibraryItem[] {
    return items
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, limit);
  }

  private getStaleContent(items: ContentLibraryItem[], daysThreshold: number): ContentLibraryItem[] {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

    return items.filter(item => 
      item.updatedAt < thresholdDate && 
      item.metadata.status === 'published'
    );
  }

  private calculateGrowthMetrics(items: ContentLibraryItem[]): ContentAnalytics['growth'] {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const itemsLastWeek = items.filter(item => item.createdAt >= oneWeekAgo).length;
    const itemsLastMonth = items.filter(item => item.createdAt >= oneMonthAgo).length;
    const itemsSecondMonth = items.filter(item => 
      item.createdAt >= twoMonthsAgo && item.createdAt < oneMonthAgo
    ).length;

    const growthRate = itemsSecondMonth > 0 
      ? ((itemsLastMonth - itemsSecondMonth) / itemsSecondMonth) * 100 
      : itemsLastMonth > 0 ? 100 : 0;

    return {
      itemsCreatedLastWeek: itemsLastWeek,
      itemsCreatedLastMonth: itemsLastMonth,
      growthRate,
    };
  }
}

export const contentLibraryService = new ContentLibraryService();
