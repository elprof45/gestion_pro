import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import ProjectFormServer from '@/components/ProjectFormServer';
import ProjectsClient from '@/components/ProjectsClient';
import { getCurrentUser } from '@/lib/session';
import { SignOut } from '@/components/SignOutButton';

export default async function Page() {
  // données server
  const [projects, authors, current] = await Promise.all([
    prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { authors: { include: { author: true } } },
      take: 50
    }),
    prisma.author.findMany(),
    getCurrentUser() // { session, user } | null
  ])

  const user = current?.user ?? null
  const isManagerOrAdmin = user && (user.role === 'MANAGER' || user.role === 'ADMIN')

  // mini-stats
  const totalProjects = projects.length
  const statusCount = projects.reduce(
    (acc: Record<string, number>, p: any) => {
      acc[p.status] = (acc[p.status] ?? 0) + 1
      return acc
    },
    {}
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Tableau de bord — Projets</h1>
            <p className="text-sm text-muted mt-1">Consultez les projets, recherchez et connectez-vous pour contribuer.</p>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="text-2xl font-extrabold tracking-tight">{user.name ?? user.role}</div>
                <SignOut />
              </div>
            ) : (
              <div className="flex gap-2">
                <Link href="/signin" className="btn btn-primary btn-sm">Se connecter</Link>
                <Link href="/register" className="btn btn-ghost btn-sm">S'inscrire</Link>
              </div>
            )}
          </div>
        </div>

      {/* stats pills */}
      <div className="flex gap-3 overflow-x-auto pb-2 mb-6">
        <div className="rounded-lg p-3 bg-base-100 shadow-sm min-w-[160px]">
          <div className="text-xs text-muted">Total</div>
          <div className="text-xl font-bold">{totalProjects}</div>
        </div>
        <div className="rounded-lg p-3 bg-base-100 shadow-sm min-w-[160px]">
          <div className="text-xs text-muted">En cours</div>
          <div className="text-xl font-bold">{statusCount['IN_PROGRESS'] ?? 0}</div>
        </div>
        <div className="rounded-lg p-3 bg-base-100 shadow-sm min-w-[160px]">
          <div className="text-xs text-muted">Idées</div>
          <div className="text-xl font-bold">{statusCount['IDEA'] ?? 0}</div>
        </div>
        <div className="rounded-lg p-3 bg-base-100 shadow-sm min-w-[160px]">
          <div className="text-xs text-muted">À revoir</div>
          <div className="text-xl font-bold">{statusCount['REVIEW'] ?? 0}</div>
        </div>
        <div className="rounded-lg p-3 bg-base-100 shadow-sm min-w-[160px]">
          <div className="text-xs text-muted">Terminés</div>
          <div className="text-xl font-bold">{statusCount['DONE'] ?? 0}</div>
        </div>
      </div>

      {/* grid: left = quick create / right = list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: create quick (only for manager/admin) */}
        <aside className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            <div className="card bg-base-100 p-4 shadow">
              <h2 className="text-lg font-semibold">Créer un projet rapidement</h2>
                           <div className="mt-4">
                {isManagerOrAdmin ? (
                  <ProjectFormServer authors={authors} />
                ) : user ? (
                  <div className="p-3 rounded bg-base-200">
                    <p className="text-sm">Votre compte n'a pas les permissions pour créer des projets.</p>
                    <div className="mt-3 flex gap-2">
                      <Link href="/profile" className="btn btn-ghost btn-sm">Voir profil</Link>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded bg-base-200 space-y-3">
                    <p className="text-sm">Pour créer un projet, <strong>connectez-vous</strong> ou <strong>inscrivez-vous</strong>.</p>
                    <div className="flex gap-2">
                      <Link href="/signin" className="btn btn-primary btn-sm">Se connecter</Link>
                      <Link href="/register" className="btn btn-ghost btn-sm">S'inscrire</Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Right column: interactive list */}
        <section className="lg:col-span-2">
          <div className="card bg-base-100 p-4 shadow">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-semibold">Projets</h2>
              </div>
            </div>

            <ProjectsClient initialProjects={projects} />
          </div>
        </section>
      </div>
    </div>
  )
}
