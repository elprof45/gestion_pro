'use client';
import { registerUserAction } from "@/actions/actions";
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";


export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(formData: FormData) {
    setLoading(true)
    await registerUserAction(formData)
    setLoading(false)
  }

  return (
    <div className="flex justify-center items-center h-screen">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Inscription</CardTitle>
          <CardDescription>
          </CardDescription>
        </CardHeader>
        <form action={async (formData) => await submit(formData)} >
          <CardContent>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="name">Nom </Label>
                <Input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="Bob Tino"
                  required value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="m@example.com"
                  required value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Mot de passe</Label>
                </div>
                <Input id="password" type="password" name="password" required placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-2 mt-4">
            <Button type="submit" className="w-full">
              {loading ? '...' : "S'inscrire"}
            </Button>
          </CardFooter>
        </form>
        <Link href={'/signin'}>
          <Button variant="outline" className="mx-6">
            Se connecter
          </Button>    
        </Link>
      </Card>
    </div>

  )
}
