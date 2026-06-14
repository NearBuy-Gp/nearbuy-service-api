import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from '../../app.module';
import { Item } from '../../modules/item/schemas/item.schema';

async function createVectorIndex() {
  console.log('🚀 Initializing NestJS application...');
  const app = await NestFactory.createApplicationContext(AppModule);

  const itemModel = app.get<Model<Item>>(getModelToken(Item.name));

  console.log('🔍 Checking existing items with embeddings...');
  const itemCount = await itemModel.countDocuments({ embedding: { $exists: true, $ne: [] } }).lean();
  console.log(`   Found ${itemCount} items with embeddings`);

  if (itemCount === 0) {
    console.log('❌ No items with embeddings found. Please run seed:combined first.');
    await app.close();
    process.exit(1);
  }

  console.log('📝 Creating vector search index...');
  
  try {
    await itemModel.collection.createIndex(
      { embedding: '2dsphere' },
      { 
        name: 'embedding_geospatial_index',
        background: true,
      }
    );
    console.log('✅ Created geospatial index on embedding field');
  } catch (error) {
    console.log('   Geospatial index may already exist:', error.message);
  }

  console.log('\n⚠️  For MongoDB Atlas Vector Search, you need to create an index manually in Atlas UI:');
  console.log('   1. Go to MongoDB Atlas -> Your Cluster -> Atlas Search');
  console.log('   2. Create Index -> JSON Editor');
  console.log('   3. Use this configuration:');
  console.log(JSON.stringify({
    mappings: {
      dynamic: false,
      fields: {
        embedding: {
          type: "knnVector",
          dimensions: 384,
          metric: "cosine",
          quantization: "float"
        }
      }
    }
  }, null, 2));

  await app.close();
  console.log('👋 Application closed.');
}

createVectorIndex()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });