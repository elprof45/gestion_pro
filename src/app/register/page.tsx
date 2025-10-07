import { registerUserAction } from "@/actions/actions";


export default function RegisterPage() {
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Inscription</h1>
      <form action={registerUserAction} className="space-y-3 card p-4 bg-base-100">
        <input name="name" className="input input-bordered w-full" placeholder="Nom (optionnel)" />
        <input name="email" className="input input-bordered w-full" placeholder="Email" />
        <input name="password" type="password" className="input input-bordered w-full" placeholder="Mot de passe" />
        <div className="flex justify-end">
          <button type="submit" className="btn btn-primary">S'inscrire</button>
        </div>
      </form>
    </div>
  )
}
