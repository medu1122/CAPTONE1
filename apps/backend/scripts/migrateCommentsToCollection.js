import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Post from '../src/modules/posts/post.model.js';
import Comment from '../src/modules/comments/comment.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/GreenGrow';

async function migrateComments() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all posts with comments
    const posts = await Post.find({ 'comments.0': { $exists: true } });
    console.log(`📊 Found ${posts.length} posts with comments\n`);

    if (posts.length === 0) {
      console.log('✅ No comments to migrate');
      await mongoose.connection.close();
      return;
    }

    let totalComments = 0;
    let migratedComments = 0;
    let skippedComments = 0;

    for (const post of posts) {
      if (!post.comments || post.comments.length === 0) {
        continue;
      }

      console.log(`📝 Processing post: ${post._id} (${post.comments.length} comments)`);
      totalComments += post.comments.length;

      // Create a map to track comment IDs for parent references
      const commentIdMap = new Map();

      // First pass: Create all comments and map old IDs to new IDs
      for (const oldComment of post.comments) {
        try {
          // Check if comment already exists (in case of re-run)
          const existingComment = await Comment.findOne({
            post: post._id,
            author: oldComment.author,
            content: oldComment.content,
            createdAt: oldComment.createdAt,
          });

          if (existingComment) {
            console.log(`   ⏭️  Comment already exists, skipping: ${oldComment._id}`);
            commentIdMap.set(oldComment._id.toString(), existingComment._id);
            skippedComments++;
            continue;
          }

          // Create new comment
          const newComment = await Comment.create({
            post: post._id,
            author: oldComment.author,
            parentComment: oldComment.parentComment || null,
            content: oldComment.content,
            images: oldComment.images || [],
            likes: oldComment.likes || [],
            replyCount: 0, // Will be updated in second pass
            createdAt: oldComment.createdAt,
            updatedAt: oldComment.updatedAt,
          });

          // Map old ID to new ID
          commentIdMap.set(oldComment._id.toString(), newComment._id);
          migratedComments++;

          console.log(`   ✅ Migrated comment: ${oldComment._id} → ${newComment._id}`);
        } catch (error) {
          console.error(`   ❌ Error migrating comment ${oldComment._id}:`, error.message);
        }
      }

      // Second pass: Update parentComment references to use new IDs
      for (const [oldId, newId] of commentIdMap.entries()) {
        const comment = await Comment.findById(newId);
        if (comment && comment.parentComment) {
          const newParentId = commentIdMap.get(comment.parentComment.toString());
          if (newParentId && newParentId.toString() !== comment.parentComment.toString()) {
            comment.parentComment = newParentId;
            await comment.save();
            console.log(`   🔗 Updated parent reference: ${comment._id}`);
          }
        }
      }

      // Update replyCount for all comments
      for (const [oldId, newId] of commentIdMap.entries()) {
        const replyCount = await Comment.countDocuments({ parentComment: newId });
        if (replyCount > 0) {
          await Comment.findByIdAndUpdate(newId, { replyCount });
        }
      }

      // Update post to remove embedded comments (optional - keep for backward compatibility)
      // Uncomment if you want to remove embedded comments after migration
      // await Post.findByIdAndUpdate(post._id, { $unset: { comments: 1 } });
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   Total comments found: ${totalComments}`);
    console.log(`   Migrated: ${migratedComments}`);
    console.log(`   Skipped (already exists): ${skippedComments}`);
    console.log('\n✅ Migration completed successfully!');

    // Create indexes if not exists
    console.log('\n📊 Creating indexes...');
    const db = mongoose.connection.db;
    const commentsCollection = db.collection('comments');

    const indexes = [
      { post: 1, createdAt: -1 },
      { author: 1, createdAt: -1 },
      { parentComment: 1, createdAt: -1 },
      { post: 1, parentComment: 1 },
      { post: 1, parentComment: null, createdAt: -1 },
    ];

    for (const index of indexes) {
      try {
        await commentsCollection.createIndex(index);
        console.log(`   ✅ Index created:`, index);
      } catch (error) {
        console.log(`   ⚠️  Index may already exist:`, index);
      }
    }

  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

migrateComments();

