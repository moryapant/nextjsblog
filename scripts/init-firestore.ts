import { config } from 'dotenv'
config({ path: '.env.migration' })

import { adminDb } from '../lib/firebase-admin'

async function initializeCollections() {
  try {
    // Create test user
    await adminDb.collection('users').doc('test_user_1').set({
      displayName: "Test User",
      email: "test@example.com",
      photoURL: "https://example.com/photo.jpg",
      createdAt: new Date(),
      updatedAt: new Date()
    })

    // Create test subfapp
    await adminDb.collection('subfapps').doc('movies').set({
      name: "movies",
      memberCount: 0,
      description: "Movie discussions",
      createdAt: new Date(),
      updatedAt: new Date()
    })

    // Create test post
    await adminDb.collection('posts').doc('test_post_1').set({
      title: "Test Post",
      content: "Test content",
      subfapp: "movies",
      userId: "test_user_1",
      upvotes: 0,
      downvotes: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    console.log('Collections initialized successfully!')
  } catch (error) {
    console.error('Error initializing collections:', error)
  }
}

initializeCollections() 