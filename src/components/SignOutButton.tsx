"use client";
import { signOut } from "next-auth/react";
import ActionButton from "./ui/ActionButton";

export function SignOut() {
  return   <ActionButton variant="default" onClick={() => signOut({ callbackUrl: '/' })}>Déconnexion</ActionButton>

}