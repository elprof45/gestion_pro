'use client'
import React, { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function SignInPage(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function submit(e: React.FormEvent){
    e.preventDefault()
    setLoading(true)
    const res = await signIn('credentials', { redirect: false, email, password })
    setLoading(false)
    if (res?.ok) router.push('/')
    else alert('Échec connexion')
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Connexion</h1>
      <form onSubmit={submit} className="space-y-3 card p-4 bg-base-100">
        <input className="input input-bordered w-full" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input type="password" className="input input-bordered w-full" placeholder="Mot de passe" value={password} onChange={e=>setPassword(e.target.value)} />
        <div className="flex justify-between">
          <button className="btn" type="submit">{loading ? '...' : 'Se connecter'}</button>
        </div>
      </form>
    </div>
  )
}
