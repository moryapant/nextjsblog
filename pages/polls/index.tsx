import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { useState } from 'react'
import { executeQuery } from '../../lib/db'

interface Nominee {
  id: number
  name: string
  image_url: string
  movie_name: string
  votes: number
}

interface PollProps {
  nominees: Nominee[]
  totalVotes: number
}

const PollPage = ({ nominees: initialNominees, totalVotes: initialTotal }: PollProps) => {
  const [nominees, setNominees] = useState(initialNominees)
  const [totalVotes, setTotalVotes] = useState(initialTotal)
  const [votedFor, setVotedFor] = useState<number | null>(null)

  const handleVote = async (nomineeId: number) => {
    if (votedFor !== null) return // Prevent multiple votes

    try {
      const response = await fetch('/api/polls/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nomineeId }),
      })

      if (response.ok) {
        setNominees(nominees.map(nominee => 
          nominee.id === nomineeId 
            ? { ...nominee, votes: nominee.votes + 1 }
            : nominee
        ))
        setTotalVotes(prev => prev + 1)
        setVotedFor(nomineeId)
      }
    } catch (error) {
      console.error('Error voting:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Best Actress Award 2024 - Movie Blog</title>
      </Head>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Who Should Win Best Actress Award 2024?
          </h1>
          <p className="text-gray-600 mb-8">Total votes: {totalVotes}</p>

          <div className="grid gap-6 md:grid-cols-2">
            {nominees.map((nominee) => (
              <div 
                key={nominee.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative h-80">
                  <img
                    src={nominee.image_url}
                    alt={nominee.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h2 className="text-xl font-bold mb-1">{nominee.name}</h2>
                    <p className="text-sm opacity-90">for {nominee.movie_name}</p>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-600">
                      {nominee.votes} votes ({totalVotes > 0 
                        ? ((nominee.votes / totalVotes) * 100).toFixed(1)
                        : '0'}%)
                    </div>
                    <button
                      onClick={() => handleVote(nominee.id)}
                      disabled={votedFor !== null}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        votedFor === nominee.id
                          ? 'bg-green-100 text-green-800'
                          : votedFor !== null
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      }`}
                    >
                      {votedFor === nominee.id ? 'Voted!' : 'Vote'}
                    </button>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${totalVotes > 0 ? (nominee.votes / totalVotes) * 100 : 0}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const nominees = await executeQuery<Nominee[]>({
      query: `
        SELECT 
          id,
          name,
          image_url,
          movie_name,
          votes
        FROM poll_nominees
        WHERE poll_id = 1
        ORDER BY votes DESC
      `
    })

    const totalVotes = nominees.reduce((sum, nominee) => sum + nominee.votes, 0)

    return {
      props: {
        nominees: JSON.parse(JSON.stringify(nominees)),
        totalVotes
      }
    }
  } catch (error) {
    console.error('Database Error:', error)
    return {
      props: {
        nominees: [],
        totalVotes: 0
      }
    }
  }
}

export default PollPage 