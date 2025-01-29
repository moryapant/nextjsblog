import mysql from 'mysql2/promise'

// Create a singleton pool instance
let pool: mysql.Pool | null = null

const createPool = () => {
  return mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT),
    database: process.env.MYSQL_DATABASE,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD || '',
    waitForConnections: true,
    connectionLimit: 3, // Drastically reduce connection limit
    maxIdle: 3, // Match maxIdle with connectionLimit
    idleTimeout: 30000, // Reduce idle timeout to 30 seconds
    queueLimit: 10, // Limit queue size
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  })
}

const getPool = () => {
  if (!pool) {
    pool = createPool()
    
    // Add error handling
    pool.on('error', (err) => {
      console.error('Unexpected database error:', err)
      pool = null // Reset pool on error
    })

    // Add connection acquire error handling
    pool.on('acquire', () => {
      console.log('Connection acquired')
    })

    pool.on('connection', () => {
      console.log('New connection made')
    })

    pool.on('release', () => {
      console.log('Connection released')
    })
  }
  return pool
}

export async function executeQuery<T>({ 
  query, 
  values 
}: { 
  query: string
  values?: any[] 
}): Promise<T> {
  let connection: mysql.PoolConnection | null = null
  let retries = 3

  while (retries > 0) {
    try {
      const pool = getPool()
      connection = await pool.getConnection()
      
      const [results] = await connection.execute(query, values)
      return results as T
    } catch (error: any) {
      retries--
      if (error.code === 'ER_CON_COUNT_ERROR' && retries > 0) {
        // Wait for 1 second before retrying
        await new Promise(resolve => setTimeout(resolve, 1000))
        continue
      }
      throw error
    } finally {
      if (connection) {
        connection.release()
      }
    }
  }

  throw new Error('Failed to execute query after retries')
}

// Helper function for transactions
export async function withTransaction<T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const pool = getPool()
  const connection = await pool.getConnection()
  
  try {
    await connection.beginTransaction()
    const result = await callback(connection)
    await connection.commit()
    return result
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

// Cleanup function
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}

// Health check
export async function checkConnection(): Promise<boolean> {
  try {
    const pool = getPool()
    const connection = await pool.getConnection()
    connection.release()
    return true
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
}

// Add a cleanup function for API routes
export async function withConnection<T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const pool = getPool()
  const connection = await pool.getConnection()
  
  try {
    return await callback(connection)
  } finally {
    connection.release()
  }
} 