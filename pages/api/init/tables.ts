import type { NextApiRequest, NextApiResponse } from 'next'
import { executeQuery } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Create posts table if it doesn't exist
    await executeQuery({
      query: `
        CREATE TABLE IF NOT EXISTS posts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          content TEXT,
          image_url VARCHAR(255),
          subfapp VARCHAR(255) NOT NULL,
          user_id VARCHAR(255) NOT NULL,
          published_date DATE DEFAULT (CURRENT_DATE),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          upvotes INT DEFAULT 0,
          downvotes INT DEFAULT 0,
          FOREIGN KEY (subfapp) REFERENCES subfapps(name) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `,
      values: []
    })

    // Create post_votes table if it doesn't exist
    await executeQuery({
      query: `
        CREATE TABLE IF NOT EXISTS post_votes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          post_id INT NOT NULL,
          user_id VARCHAR(255) NOT NULL,
          vote_type ENUM('up', 'down') NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_vote (post_id, user_id),
          FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `,
      values: []
    })

    // Create subfapp_members table if it doesn't exist
    await executeQuery({
      query: `
        CREATE TABLE IF NOT EXISTS subfapp_members (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          subfapp_name VARCHAR(255) NOT NULL,
          joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY unique_member (user_id, subfapp_name),
          FOREIGN KEY (subfapp_name) REFERENCES subfapps(name) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `,
      values: []
    })

    // First drop the existing comments table
    await executeQuery({
      query: `DROP TABLE IF EXISTS comments`,
      values: []
    })

    // Then create the new comments table with all required columns
    await executeQuery({
      query: `
        CREATE TABLE comments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          post_id INT NOT NULL,
          user_id VARCHAR(255) NOT NULL,
          user_name VARCHAR(255) DEFAULT 'Anonymous',
          user_avatar VARCHAR(255),
          content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `,
      values: []
    })

    // Add new columns to existing comments table
    await executeQuery({
      query: `
        ALTER TABLE comments
        ADD COLUMN user_name VARCHAR(255) DEFAULT 'Anonymous' AFTER user_id,
        ADD COLUMN user_avatar VARCHAR(255) AFTER user_name
      `,
      values: []
    })

    // Create comment_likes table
    await executeQuery({
      query: `
        CREATE TABLE IF NOT EXISTS comment_likes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          comment_id INT NOT NULL,
          user_id VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY unique_like (comment_id, user_id),
          FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `,
      values: []
    })

    // Create comment_replies table
    await executeQuery({
      query: `
        CREATE TABLE IF NOT EXISTS comment_replies (
          id INT AUTO_INCREMENT PRIMARY KEY,
          parent_comment_id INT NOT NULL,
          user_id VARCHAR(255) NOT NULL,
          user_name VARCHAR(255) DEFAULT 'Anonymous',
          user_avatar VARCHAR(255),
          content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `,
      values: []
    })

    res.status(200).json({ message: 'Tables created successfully' })
  } catch (error) {
    console.error('Error creating tables:', error)
    res.status(500).json({ 
      message: 'Error creating tables', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
} 