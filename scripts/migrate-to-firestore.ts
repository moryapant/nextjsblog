import { config } from 'dotenv'
config({ path: '.env.migration' })

import { adminDb } from '../lib/firebase-admin'

async function initializeCollections() {
  try {
    // 1. Create Users Collection
    const users = [
      {
        id: '9twYIs7uI0dXfWR7bdGH8fviC9W2',
        displayName: "moreshwar pantwalavalkar",
        email: "morya123@gmail.com",
        photoURL: "https://lh3.googleusercontent.com/a/ACg8ocLdKP8zX9cpPFqNxJyp-VCPv7pbteJK5DqphWouOqX9gz6_ycLw=s96-c"
      },
      {
        id: 'WBMw0UYhkRcrwYiO7Ho8IzJ5riE3',
        displayName: "SLOW MOW",
        email: "bollykittens@gmail.com",
        photoURL: "https://lh3.googleusercontent.com/a/ACg8ocL2V78_KWV4HmAmPIUHLglBX9B5NmWVdXMZEG04KrbkUzd-GIQ=s96-c"
      }
    ]

    for (const user of users) {
      await adminDb.collection('users').doc(user.id).set({
        ...user,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }
    console.log('Users created successfully')

    // 2. Create Subfapps Collection
    const subfapps = [
      { name: 'movies', description: 'Discuss your favorite movies and latest releases' },
      { name: 'tvshows', description: 'Everything about TV series and shows' },
      { name: 'books', description: 'Book discussions and recommendations' },
      { name: 'gaming', description: 'Video games, reviews, and gaming culture' },
      { name: 'technology', description: 'Tech news and discussions' },
      { name: 'sports', description: 'Sports news and discussions' },
      { name: 'anime', description: 'Japanese animation and manga discussions' },
      { name: 'art', description: 'Share and discuss artwork' }
    ]

    for (const subfapp of subfapps) {
      await adminDb.collection('subfapps').doc(subfapp.name).set({
        ...subfapp,
        memberCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }
    console.log('Subfapps created successfully')

    // 3. Create Sample Posts
    const posts = [
      {
        id: '1',
        title: "The Future of AI in Cinema",
        content: "How artificial intelligence is transforming filmmaking...",
        subfapp: "movies",
        userId: users[0].id
      },
      {
        id: '2',
        title: "Best TV Shows of 2024",
        content: "A comprehensive list of must-watch series...",
        subfapp: "tvshows",
        userId: users[1].id
      },
      {
        id: '3',
        title: "Gaming Industry Trends",
        content: "Latest developments in gaming technology...",
        subfapp: "gaming",
        userId: users[0].id
      }
    ]

    for (const post of posts) {
      await adminDb.collection('posts').doc(post.id).set({
        ...post,
        upvotes: 0,
        downvotes: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }
    console.log('Posts created successfully')

    // 4. Create Sample Comments
    const comments = [
      {
        id: '1',
        postId: '1',
        userId: users[1].id,
        userName: users[1].displayName,
        content: "Great insights about AI in movies!",
        likes: 2
      },
      {
        id: '2',
        postId: '2',
        userId: users[0].id,
        userName: users[0].displayName,
        content: "Thanks for the recommendations",
        likes: 1
      }
    ]

    for (const comment of comments) {
      await adminDb.collection('comments').doc(comment.id).set({
        ...comment,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }
    console.log('Comments created successfully')

    // 5. Add Subfapp Members
    const memberships = [
      { subfapp: 'movies', userId: users[0].id },
      { subfapp: 'tvshows', userId: users[0].id },
      { subfapp: 'gaming', userId: users[1].id },
      { subfapp: 'technology', userId: users[1].id }
    ]

    for (const membership of memberships) {
      await adminDb.collection('subfapps').doc(membership.subfapp)
        .collection('members').doc(membership.userId).set({
          userId: membership.userId,
          joinedAt: new Date()
        })
      
      // Update member count
      await adminDb.collection('subfapps').doc(membership.subfapp).update({
        memberCount: adminDb.FieldValue.increment(1)
      })
    }
    console.log('Memberships created successfully')

    console.log('All sample data initialized successfully!')
  } catch (error) {
    console.error('Initialization failed:', error)
  }
}

initializeCollections() 