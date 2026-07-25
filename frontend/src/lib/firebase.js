import { initializeApp } from 'firebase/app'
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  linkWithCredential,
  linkWithPopup,
  signOut,
} from 'firebase/auth'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

const githubProvider = new GithubAuthProvider()
githubProvider.addScope('repo')
githubProvider.addScope('read:user')
githubProvider.setCustomParameters({ allow_signup: 'true' })

function buildUserPayload(user, provider, githubToken = null) {
  return {
    uid:      user.uid,
    name:     user.displayName ?? user.email?.split('@')[0] ?? 'User',
    email:    user.email,
    photo:    user.photoURL,
    provider,
    ...(githubToken && { githubToken }),
  }
}

export async function loginWithGitHub() {
  try {
    const result = await signInWithPopup(auth, githubProvider)
    const credential = GithubAuthProvider.credentialFromResult(result)
    const githubToken = credential?.accessToken
    if (githubToken) localStorage.setItem('github_token', githubToken)
    return buildUserPayload(result.user, 'github', githubToken)

  } catch (error) {
    if (error.code !== 'auth/account-exists-with-different-credential') throw error

    const pendingCredential = GithubAuthProvider.credentialFromError(error)
    const existingProvider = error.customData?._tokenResponse?.verifiedProvider?.[0]

    if (existingProvider === 'google.com') {
      const googleResult = await signInWithPopup(auth, googleProvider)
      const linkedResult = await linkWithCredential(googleResult.user, pendingCredential)

      const linkedCredential = GithubAuthProvider.credentialFromResult(linkedResult)
      const githubToken = linkedCredential?.accessToken
      if (githubToken) localStorage.setItem('github_token', githubToken)

      return buildUserPayload(linkedResult.user, 'github', githubToken)
    }

    throw error
  }
}

export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    return buildUserPayload(result.user, 'google')

  } catch (error) {
    if (error.code !== 'auth/account-exists-with-different-credential') throw error

    const pendingCredential = GoogleAuthProvider.credentialFromError(error)
    const existingProvider = error.customData?._tokenResponse?.verifiedProvider?.[0]

    if (existingProvider === 'github.com') {
      const githubResult = await signInWithPopup(auth, githubProvider)
      await linkWithCredential(githubResult.user, pendingCredential)

      const linkedCredential = GithubAuthProvider.credentialFromResult(githubResult)
      const githubToken = linkedCredential?.accessToken
      if (githubToken) localStorage.setItem('github_token', githubToken)

      return buildUserPayload(githubResult.user, 'google', githubToken)
    }

    throw error
  }
}

export async function connectGitHub() {
  try {
    const result = await signInWithPopup(auth, githubProvider)
    const credential = GithubAuthProvider.credentialFromResult(result)
    const githubToken = credential?.accessToken
    if (githubToken) localStorage.setItem('github_token', githubToken)
    return githubToken
  } catch (error) {
    if (error.code === 'auth/account-exists-with-different-credential') {
      throw new Error('Esa cuenta de GitHub ya está asociada a otro método de acceso.')
    }
    throw error
  }
}

export async function logout() {
  localStorage.removeItem('github_token')
  await signOut(auth)
}