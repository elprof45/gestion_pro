"use client"
import { signOut } from "next-auth/react"
 
export function SignOut() {
  return <button className="btn btn-danger btn-sm " onClick={() => signOut({ callbackUrl: '/' })}>Déconnexion</button>
}