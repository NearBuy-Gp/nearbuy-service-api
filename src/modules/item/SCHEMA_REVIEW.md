# Item Schema Review & Recommendations

## Executive Summary

Your current schema has several performance and search engine compatibility issues. This document outlines the problems found and the improvements made.

## Issues Identified

### 🔴 Critical Issues

1. **No Database Indexes**
   - **Impact**: All queries perform full collection scans
   - **Performance**: O(n) instead of O(log n) for indexed queries
   - **Search Engine**: Slow filtering and sorting operations

2. **Mixed Type for Attributes**
   - **Impact**: Cannot be indexed or efficiently queried
   - **Performance**: MongoDB cannot optimize queries on Mixed fields
   - **Search Engine**: External search engines cannot index nested Mixed fields properly

3. **Duplicate Timestamp Fields**
   - **Impact**: Redundant data storage
   - **Performance**: Unnecessary field updates
   - **Best Practice**: `timestamps: true` already handles this

### 🟡 Performance Issues

4. **No Text Search Indexes**
   - **Impact**: Full-text search requires full collection scan
   - **Performance**: Slow search queries on name/description
   - **Search Engine**: Will need to build text indexes separately

5. **No Compound Indexes**
   - **Impact**: Common query patterns (businessId + type + isAvailable) are slow
   - **Performance**: Multiple index lookups instead of single compound lookup
   - **Search Engine**: Filtering will be inefficient

## Improvements Made

### ✅ Indexes Added

1. **Single Field Indexes**
   - `name`: For name-based queries
   - `price`: For price range queries and sorting
   - `isAvailable`: For filtering available items
   - `businessId`: For business-based queries
   - `type`: For type filtering
   - `createdAt`: For sorting by date

2. **Compound Indexes**
   - `{ businessId: 1, type: 1 }`: Query items by business and type
   - `{ businessId: 1, isAvailable: 1 }`: Query available items by business
   - `{ businessId: 1, type: 1, isAvailable: 1 }`: Combined filter (most common pattern)
   - `{ price: 1, type: 1 }`: Price range queries by type

3. **Text Index**
   - Full-text search on `name` and `description`
   - Weighted: name (10x) > description (5x)
   - Enables MongoDB text search: `db.items.find({ $text: { $search: "pizza" } })`

### ✅ Schema Optimizations

1. **Removed Duplicate Timestamps**
   - Removed manual `createdAt` and `updatedAt` fields
   - Using `timestamps: true` from decorator

2. **Added Collection Name**
   - Explicit collection name for clarity

## Search Engine Compatibility

### Current State (Before Improvements)

- ❌ No text indexes → Full collection scans for search
- ❌ No compound indexes → Slow filtering
- ❌ Mixed type attributes → Cannot be indexed by search engines
- ❌ No price range indexes → Slow price filtering

### After Improvements

- ✅ Text indexes → Fast full-text search
- ✅ Compound indexes → Fast filtering
- ⚠️ Mixed type still present → Consider migration (see recommendations)

## Recommendations for Future

### 1. **Migrate Away from Mixed Type**

The `attributes` field using `MongooseSchema.Types.Mixed` is problematic. You're already using discriminators, which is good. Consider:

**Option A: Remove Mixed Field Entirely**

```typescript
// Remove the attributes field since discriminators handle type-specific fields
// This requires a migration to move data from attributes to discriminator fields
```

**Option B: Use Strict Schema for Attributes**

```typescript
@Prop({
  type: {
    // Define specific fields based on type
    // This allows indexing and querying
  }
})
attributes?: RestaurantAttributes | ClinicAttributes | ...;
```

### 2. **Add Geospatial Indexes (if needed)**

If you need location-based search:

```typescript
// In Business schema, add:
@Prop({
  type: {
    type: String,
    enum: ['Point'],
    required: true,
  },
  coordinates: {
    type: [Number],
    required: true,
  },
})
location: {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
};

// Then create geospatial index:
BusinessSchema.index({ location: '2dsphere' });
```

### 3. **Consider Search Engine Integration**

For advanced search features, consider:

**Elasticsearch/OpenSearch:**

- Better full-text search
- Faceted search (filters, aggregations)
- Fuzzy matching, synonyms
- Real-time indexing via change streams

**Algolia/Meilisearch:**

- Typo tolerance
- Instant search
- Analytics
- Easy integration

**Implementation Pattern:**

```typescript
// Use MongoDB Change Streams to sync with search engine
const changeStream = Item.watch();
changeStream.on('change', async (change) => {
  await syncToSearchEngine(change);
});
```

### 4. **Query Optimization**

Update your service methods to leverage indexes:

```typescript
// ✅ Good - uses compound index
await this.itemModel
  .find({
    businessId,
    type,
    isAvailable: true,
  })
  .sort({ createdAt: -1 });

// ✅ Good - uses text index
await this.itemModel.find({
  $text: { $search: searchTerm },
  businessId,
  isAvailable: true,
});

// ❌ Bad - doesn't use index efficiently
await this.itemModel
  .find({
    isAvailable: true,
  })
  .then((items) => items.filter((item) => item.businessId === businessId));
```

### 5. **Add Pagination Indexes**

For efficient pagination:

```typescript
ItemSchema.index({ createdAt: -1, _id: 1 }); // For cursor-based pagination
```

### 6. **Consider Denormalization**

For frequently accessed data:

```typescript
@Prop({
  type: {
    name: String,
    category: String,
  },
  _id: false,
})
businessInfo: {
  name: string;
  category: string;
};
```

## Performance Benchmarks (Expected)

### Before Improvements

- Query by businessId + type: ~500ms (full scan)
- Text search: ~2000ms (full scan)
- Price range query: ~800ms (full scan)

### After Improvements

- Query by businessId + type: ~5-10ms (index lookup)
- Text search: ~20-50ms (text index)
- Price range query: ~10-20ms (index lookup)

## Migration Steps

1. **Deploy Schema Changes**

   ```bash
   # Indexes will be created automatically on first query
   # Or create manually:
   npm run migrate:indexes
   ```

2. **Monitor Index Usage**

   ```javascript
   // Check index usage
   db.items.aggregate([{ $indexStats: {} }]);
   ```

3. **Remove Mixed Attributes (Future)**
   - Create migration script
   - Move data from `attributes` to discriminator fields
   - Update application code
   - Remove `attributes` field

## Testing Recommendations

1. **Load Testing**
   - Test queries with 10K+ items
   - Measure query performance
   - Monitor index usage

2. **Search Testing**
   - Test text search with various terms
   - Test compound queries
   - Test edge cases (empty results, large result sets)

3. **Index Maintenance**
   - Monitor index size
   - Rebuild indexes if needed
   - Consider partial indexes for sparse fields

## Conclusion

The improved schema addresses:

- ✅ Performance bottlenecks
- ✅ Search engine compatibility
- ✅ Query optimization
- ✅ Best practices

**Next Steps:**

1. Deploy the improved schema
2. Monitor performance improvements
3. Plan migration away from Mixed type
4. Consider external search engine for advanced features
