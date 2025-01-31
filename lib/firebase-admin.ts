import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const serviceAccount = {
  type: "service_account",
  project_id: "blogs-4db78",
  private_key_id: "f65c1b355b82af667276386dcca9ee1d81b35c44",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCiq2irNr7AmV0e\nTHrRZTSP7FTU1+HoXMGe1/EZaOfRqhrB0xE/NsRKGnbq9MoG9/OIqQy3hLqnLQF1\n1rfA1Xxfk6f7KXdxzJuj+MYOgplPxm5q6aRJeAfPjgavkshe5u4FjYVj/wb49yml\natlh1mKVuWzmi9xxujBgqC2CISttu3NGEI26EdLKj7MjZTDpvLZO/XSKTAoGPsEI\nNr1YSWNIyKq+fJh7BZVWWiTsQR2hzhdLag744skD9U/KMGSAhlHJFN5hQnlH7gYj\n/S9wxWD0tvxrC6SdxkLNUoSqiaDQAHsNA41uJrClujWDjCrzhzQkidZ/bU4CFNP+\noJNTYd//AgMBAAECggEAGs2QgQmTs6txdvEWGZOJ7h78OVfa7sz90Dz3in7JF7hm\nEULEaDyPakBjEMLF2REY7Q8hu8lgcfRN9csr2teyVxM+zfkep78VdBalF7X4Kfdh\nsTcPLVXcP5xAyMQwRMbbOEoBzSCz1uju0UVCTUckVlRHt9Mavxh1KS/806DAhaNm\nel0KOytcrSXy+5YjnOemOVe2wGSqrUXptUPCxLAuGos6fpBi/dzW/Q8xgRQ7WQw5\n1cHrRSz93NV78f9mqFT6Yu4qiFekE+ochK7Nk2LctLxGQvfJ68ZeHPXyzG2/+mYq\neJU48QdGnf2Kb56sSKqrsaGyckYUQBl9Ys9/UtrwJQKBgQDXOTlghYJ5NOKmYvoO\nv0CLnIZjxzg9OtXqzYbfMLtYOjHfBNVmbaNX366FvvQFKIVLq9GyWeflkKmnRkqg\n+ZJM7OabYenpnu/Vp9TiARkoL8ZwMNgjuGrGo+97lP8m0J3YLir4uwl2qJNURePr\nLuNaDaRaPs6j3vrNpqMzvyZotQKBgQDBfTYV1kx55aYHiQYyOfWgZAUmsD57lnIq\nfdZ5TmBURU8LsQzfnf0S8owH3E/9VaCVzxYLNX1Szme4gYrU+FEcdmrMZCHS2C1e\nL2L1leDHKb4EMNwD9WNn4mgaRk4Y18FxjdWqEMmGiE7mJPa7v2bhfZ8V6PZqXG5s\nCiODxXEaYwKBgEAn/sKXCd23thiDSKc8u7DiZ+02Zb1a3Imx2pKNpEsYjeU9O5/c\n7uQy+YNE+NjQy2tTPJ89zbLQ/MGwYm659rKXq+aFuYS6rCO0c/ErAqTIGQ84gDWl\ns66jD7B3KdgYN/VJTeX3W0rT1Zc5fkeNIpilmGiOcGrI/VpwYhX61ShBAoGAf2Q+\nEOCYV4WA6+MmpjkM5H4V+iP974bdQea6KAIXYESFx6/ZRv2RG0GAOsiuDaCr6xZ+\ncADWs4dcONlpm9CmLrQ0mr+umVBlhmZypDj61oZAKig1I5IT0dj6K5pwXuDm5ym4\nLJGC7cWfFN3vaSuaxAnejSFl5B9ZQF7ohSCg1/sCgYBAkaXAPhev0Uek/xwLU0e2\nKFEEdY/ebPqYy3E9GDq04VHRyLrWyaXHtx0M9Psj3V/0eePcigJzvq6MxMACWfnA\n3IJegIpEyU7m8qJf3gdzHdRdsnDQkymCwBH8N5d5E6ZMAo3lfk2YCOVjn60MH0qc\nULox/AD7/GGpj4U9KQbevw==\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@blogs-4db78.iam.gserviceaccount.com",
  client_id: "114224192647413331187",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40blogs-4db78.iam.gserviceaccount.com"
}

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount)
  })
}

export const adminDb = getFirestore() 