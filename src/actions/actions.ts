"use server";;
import { prisma } from '@/lib/prisma';
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { auth, signIn, signOut } from "@/lib/auth";

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

async function requireRole(minRole: 'USER' | 'MANAGER' | 'ADMIN') {
  const session = await auth()
  if (!session?.user?.email) throw new Error('Non authentifié')
  // get user role
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) throw new Error('Utilisateur introuvable')

  const order = { USER: 0, MANAGER: 1, ADMIN: 2 } as const
  if (order[user.role] < order[minRole]) throw new Error('Non autorisé')
  return user
}

export async function createProjectAction(formData: FormData) {
  const user = await requireRole('ADMIN') // ADMIN+ admin
  const title = String(formData.get('title') ?? '')
  const description = String(formData.get('description') ?? '')
  const status = String(formData.get('status') ?? 'IDEA')
  const dueDateRaw = formData.get('dueDate')
  const authorIds = formData.getAll('authorIds') as string[]
  await prisma.project.create({
    data: {
      title,
      description,
      status: status as any,
      authorPrincipal: user.name,
      dueDate: dueDateRaw ? new Date(String(dueDateRaw)) : undefined,
      authors: {
        create: authorIds.map((id) => ({ authorId: id }))
      }
    },
    include: { authors: { include: { author: true } } }
  })

  revalidatePath('/')
}

export async function updateProjectAction(formData: FormData) {
  await requireRole('ADMIN')
  const id = String(formData.get('id'))
  const title = String(formData.get('title') ?? '')
  const description = String(formData.get('description') ?? '')
  const status = String(formData.get('status') ?? 'IDEA')
  const dueDateRaw = formData.get('dueDate')
  const authorIds = formData.getAll('authorIds') as string[]

  await prisma.project.update({ where: { id }, data: { title, description, status: status as any, dueDate: dueDateRaw ? new Date(String(dueDateRaw)) : null } })

  await prisma.projectAuthor.deleteMany({ where: { projectId: id } })
  if (authorIds && authorIds.length) {
    await prisma.projectAuthor.createMany({ data: authorIds.map(a => ({ projectId: id, authorId: a })) })
  }

  revalidatePath(`/projects/${id}`)
}

export async function deleteProjectAction(formData: FormData) {
  await requireRole('ADMIN') // suppression réservée aux ADMINs et admins
  const id = String(formData.get('id'))
  await prisma.projectAuthor.deleteMany({ where: { projectId: id } })
  await prisma.project.delete({ where: { id } })
   redirect('/')
}


export async function authenticate(formData: FormData) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type) {
        return {
          isError: true,
          message: "Invalid credentials.",
        };
      } else {
        return {
          isError: true,
          message: "Something went wrong.",
        };
      }
    }
    throw error;
  }
}

export async function registerUserAction(formData: FormData) {
  const name = String(formData.get('name') ?? '')
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')

  if (!email || !password || !name) throw new Error('Email / mot de passe requis')

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw new Error('Email déjà utilisé')

  const hashed = await bcrypt.hash(password, 10)
  await prisma.user.create({
    data: { name, email, password: hashed, role: 'ADMIN' }
  })
  await prisma.author.createMany({
    data: { name, email },
    // skipDuplicates: true
  })

  revalidatePath('/')
  redirect('/login')
}

  export const handleSignOut = async () => {
    await signOut()
  };
