import { GetServerSideProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { executeQuery } from '../../lib/db'

interface Movie {
  id: number
  title: string
  description: string
  release_date: string
  poster_url?: string
  rating?: number | null
}

interface MovieDetailProps {
  movie: Movie | null
}

const MovieDetail = ({ movie }: MovieDetailProps) => {
  if (!movie) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Movie not found</h1>
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← Back to home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>{movie.title} - Movie Blog</title>
        <meta name="description" content={movie.description} />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to home
          </Link>

          <article className="bg-white rounded-lg shadow-lg overflow-hidden">
            {movie.poster_url && (
              <div className="relative h-96 w-full">
                <img
                  src={movie.poster_url}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-4xl font-bold text-gray-900">{movie.title}</h1>
                {movie.rating != null && typeof movie.rating === 'number' && (
                  <span className="flex items-center bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-lg font-medium">
                    <svg className="w-6 h-6 mr-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {movie.rating.toFixed(1)}
                  </span>
                )}
              </div>

              <time className="block text-gray-500 mb-6">
                {new Date(movie.release_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>

              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  {movie.description}
                </p>
              </div>
            </div>
          </article>
        </div>
      </main>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  try {
    const movies = await executeQuery<Movie[]>({
      query: `
        SELECT 
          id, 
          title, 
          description, 
          DATE_FORMAT(release_date, '%Y-%m-%d') as release_date,
          poster_url,
          rating
        FROM movies 
        WHERE id = ?
      `,
      values: [params?.id]
    })

    return {
      props: {
        movie: movies[0] || null
      }
    }
  } catch (error) {
    console.error('Database Error:', error)
    return {
      props: {
        movie: null
      }
    }
  }
}

export default MovieDetail 