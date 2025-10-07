'use client';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function HeaderClient(){
  const { data: session } = useSession()

  return (
    <div className="flex items-center gap-3">
      {session?.user ? (
        <>
          <div className="text-sm">Salut, {session.user.name ?? session.user.email}</div>
          <button className="btn btn-ghost btn-sm" onClick={() => signOut({ callbackUrl: '/signin' })}>Déconnexion</button>
        </>
      ) : (
        <>
          <Link href="/signin" className="btn btn-ghost btn-sm">Connexion</Link>
          <Link href="/register" className="btn btn-ghost btn-sm">Inscription</Link>
        </>
      )}
    </div>
  )
}
