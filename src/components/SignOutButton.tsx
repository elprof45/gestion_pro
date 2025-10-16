"use client";;
import { handleSignOut } from "@/actions/actions";
import ActionButton from "./ui/ActionButton";

export function SignOut() {
  return (
     <form
      action={handleSignOut}
    >
      <ActionButton type="submit" variant={"default"}>Déconnexion</ActionButton>
    </form>
  );
}