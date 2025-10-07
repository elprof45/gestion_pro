import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('search') ?? '').trim();
    const status = (searchParams.get('status') ?? '').trim();
    const where: any = {};

    if (status && status.toLowerCase() !== 'all') {
      where.status = status;
    }
    if (q) {
      where.OR = [
        { title: { contains: q} },
        { description: { contains: q } },
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: { authors: { include: { author: true } } },
      take: 100,
    });

    return NextResponse.json(projects);
  } catch (error: any) {
    console.error('GET /api/projects error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des projets.' },
      { status: 500 }
    );
  }
}
