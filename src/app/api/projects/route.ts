// app/api/projects/route.ts
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(req: Request){

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('search') ?? ''
  const status = searchParams.get('status') ?? ''

  const where: any = {}
  if (q) where.title = { contains: q, mode: 'insensitive' }
  if (status) where.status = status

  const projects = await prisma.project.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    include: { authors: { include: { author: true } } },
    take: 100
  })
  return NextResponse.json(projects)
}
