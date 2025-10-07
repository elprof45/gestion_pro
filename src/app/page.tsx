import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import ProjectFormServer from '@/components/ProjectFormServer';
import ProjectsClient from '@/components/ProjectsClient';
import { getCurrentUser } from '@/lib/session';
import { SignOut } from '@/components/SignOutButton';

export default async function Page() {
  const [projects, authors, current] = await Promise.all([
    prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { authors: { include: { author: true } } },
      take: 50
    }),
    prisma.author.findMany(),
    getCurrentUser()
  ]);

  const user = current?.user ?? null;
  const isManagerOrAdmin = Boolean(user && (user.role === 'MANAGER' || user.role === 'ADMIN'));

  const totalProjects = projects.length;
  const statusCount = projects.reduce(
    (acc: Record<string, number>, p: any) => {
      acc[p.status] = (acc[p.status] ?? 0) + 1;
      return acc;
    },
    {}
  );
  const card = [
    { label: 'Total', value: totalProjects, color: 'primary' },
    { label: 'En cours', value: statusCount['IN_PROGRESS'] ?? 0, color: 'info' },
    { label: 'Idées', value: statusCount['IDEA'] ?? 0, color: 'warning' },
    { label: 'À revoir', value: statusCount['REVIEW'] ?? 0, color: 'error' },
    { label: 'Terminés', value: statusCount['DONE'] ?? 0, color: 'success' },
  ]
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
      {isManagerOrAdmin && (
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
          {card.map((stat, idx) => (
            <div
              key={idx}
              className="
        rounded-xl
        p-4
        bg-base-100
        border border-base-300
        shadow-sm
        hover:shadow-lg
        hover:-translate-y-1
        transition-all
        duration-300
        cursor-pointer
           block
        hover:border-primary/50
        hover:bg-base-200
        group
        overflow-hidden
      "
            >
              <div className="text-xs text-base-content/60 font-medium">
                {stat.label}
              </div>
              <div
                className={`
          text-2xl font-bold mt-1
          text-${stat.color}
        `}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>

      )}

      <div className={`grid grid-cols-1 gap-6 ${isManagerOrAdmin ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>
        {/* Left column: create quick (visible sur lg+) */}
        {isManagerOrAdmin && (
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              <div className="card bg-base-100 p-4 shadow">
                <h2 className="text-lg font-semibold">Créer un projet rapidement</h2>
                <div className="mt-4">
                  <ProjectFormServer authors={authors} />
                </div>
              </div>
            </div>
          </aside>
        )}
        {isManagerOrAdmin && (
          <div className="block lg:hidden">
            <details className="group">
              <summary
                className="btn btn-outline w-full flex justify-between items-center"
                aria-controls="quick-create-form"
                aria-expanded="false"
              >
                <span>Créer un projet</span>
                <span className="ml-2 text-sm opacity-60 group-open:rotate-180 transition-transform">▾</span>
              </summary>

              <div id="quick-create-form" className="mt-3 card bg-base-100 p-4 shadow">
                <ProjectFormServer authors={authors} />
              </div>
            </details>
          </div>
        )}

        {/* Right column: interactive list */}
        <section className={isManagerOrAdmin ? 'lg:col-span-2' : 'lg:col-span-1'}>
          <div className="card bg-base-100 p-4 shadow">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-semibold">Projets</h2>
                <p className="text-sm text-muted mt-1">Liste des projets (triés par mise à jour).</p>
              </div>
            </div>

            {/* container pour la liste : permet overflow si la liste est longue */}
            <div className="min-h-[200px]">
              <ProjectsClient projetsInitiaux={projects} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
