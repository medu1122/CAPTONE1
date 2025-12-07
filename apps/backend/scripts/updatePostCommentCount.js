import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Post from '../src/modules/posts/post.model.js';
import Comment from '../src/modules/comments/comment.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/GreenGrow';

async function updatePostCommentCount() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all posts
    const posts = await Post.find({});
    console.log(`📊 Found ${posts.length} posts\n`);

    let updated = 0;

    for (const post of posts) {
      // Count comments in Comment collection
      const commentCount = await Comment.countDocuments({ post: post._id });
      
      // Update post's commentCount
      await Post.findByIdAndUpdate(post._id, { commentCount });
      
      console.log(`✅ Post ${post._id}: Updated commentCount to ${commentCount}`);
      updated++;
    }

    console.log(`\n✅ Updated commentCount for ${updated} posts`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

updatePostCommentCount();

