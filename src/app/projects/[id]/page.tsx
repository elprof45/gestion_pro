import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import ProjectFormServer from '@/components/ProjectFormServer'
import { format } from 'date-fns'
import { auth } from '@/lib/auth'
import { deleteProjectAction } from '@/actions/actions'
import ButtonClient from '@/components/ButtonClient'


function statusBadgeClass(status: string) {
  switch (status) {
    case 'IN_PROGRESS': return 'badge badge-primary'
    case 'REVIEW': return 'badge badge-warning'
    case 'DONE': return 'badge badge-success'
    default: return 'badge badge-ghost'
  }
}

function initials(name?: string) {
  if (!name) return '??'
  const parts = name.split(' ').filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0,2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export default async function ProjectPage({ params }: { params: { id: string } }) {
   const { id } =  params
  const project = await prisma.project.findUnique({
    where: { id },
    include: { authors: { include: { author: true } } }
  })

  const authors = await prisma.author.findMany()
  const current = await auth() // { session, user } | null
  const user = current?.user ? { ...current.user, role: (current.user as any).role } : null

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card bg-base-100 p-6 shadow-lg mt-8">
          <h2 className="text-2xl font-semibold">Projet non trouvé</h2>
          <p className="text-sm text-muted mt-2">Le projet que vous cherchez n'existe pas ou a été supprimé.</p>
          <div className="mt-4">
            <Link href="/" className="btn btn-ghost">Retour au tableau</Link>
          </div>
        </div>
      </div>
    )
  }

  const canEdit = user && (user.role === 'MANAGER' || user.role === 'ADMIN')
  const canDelete = user && user.role === 'ADMIN'

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      {/* Top / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <nav className="text-sm breadcrumbs">
            <ul>
              <li><Link href="/">Tableau</Link></li>
              <li><Link href="/projects">Projets</Link></li>
              <li>{project.title}</li>
            </ul>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-extrabold mt-2 leading-tight">{project.title}</h1>
          <p className="text-sm text-muted mt-1">Détails du projet — consultez, partagez ou connectez-vous pour modifier</p>
        </div>

        <div className="flex items-center gap-3">
          <div className={statusBadgeClass(project.status)}>{project.status}</div>
          {project.dueDate && (
            <div className="text-xs text-muted">{format(new Date(project.dueDate), 'dd/MM/yyyy')}</div>
          )}
          <Link href="/projects" className="btn btn-ghost btn-sm">Retour</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main detail card */}
        <div className="lg:col-span-2">
          <div className="card bg-base-100 p-6 shadow-md">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-xl font-semibold">{project.title}</h2>
                <p className="mt-3 text-base leading-relaxed text-gray-700">{project.description ?? 'Aucune description fournie.'}</p>

                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Auteurs</h3>
                  <div className="flex items-center gap-3 flex-wrap">
                    {project.authors.map((pa:any) => (
                      <div key={pa.author.id} className="flex items-center gap-3">
                        <div className="avatar">
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                            {initials(pa.author.name)}
                          </div>
                        </div>
                        <div className="text-sm">
                          <div className="font-medium">{pa.author.name}</div>
                          {pa.author.email && <div className="text-xs text-muted">{pa.author.email}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-md p-3 bg-base-200">
                    <div className="text-xs text-muted">Créé</div>
                    <div className="text-sm">{new Date(project.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="rounded-md p-3 bg-base-200">
                    <div className="text-xs text-muted">Dernière mise à jour</div>
                    <div className="text-sm">{new Date(project.updatedAt).toLocaleString()}</div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  {/* Action area: if user -> actions, else invite to signin/register */}
                  {user ? (
                    <>
                      {canEdit ? (
                        <Link href={`#edit`} className="btn btn-primary">Éditer le projet</Link>
                      ) : (
                        <button className="btn btn-ghost" disabled title="Rôle insuffisant">Éditer (restreint)</button>
                      )}

                      {canDelete ? (
                        <form
                          action={deleteProjectAction}
                          className="inline"
                     
                        >
                          <input type="hidden" name="id" value={project.id} />
                          <ButtonClient/>
                        </form>
                      ) : (
                        <button className="btn btn-ghost" disabled title="Supprimer (admin only)">Supprimer</button>
                      )}

                      <Link href="/projects" className="btn btn-outline">Voir tous les projets</Link>
                    </>
                  ) : (
                    <>
                      <Link href="/signin" className="btn btn-primary">Se connecter</Link>
                      <Link href="/register" className="btn btn-ghost">S'inscrire</Link>
                      <span className="text-sm text-muted">Connectez-vous pour créer, éditer ou supprimer des projets.</span>
                    </>
                  )}
                </div>
              </div>

              {/* Right column on wide screens: quick stats or meta */}
              <aside className="w-full sm:w-52">
                <div className="rounded-lg border p-4 bg-base-100">
                  <div className="text-xs text-muted">Statistiques</div>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between">
                      <div className="text-sm text-muted">Auteurs</div>
                      <div className="font-medium text-sm">{project.authors.length}</div>
                    </div>
                    <div className="flex justify-between">
                      <div className="text-sm text-muted">Échéance</div>
                      <div className="font-medium text-sm">{project.dueDate ? format(new Date(project.dueDate), 'dd/MM/yyyy') : '—'}</div>
                    </div>
                    <div className="flex justify-between">
                      <div className="text-sm text-muted">Statut</div>
                      <div className="font-medium text-sm">{project.status}</div>
                    </div>
                  </div>
                </div>

                {/* On mobile hide the edit panel to avoid duplication; on large show a small hint */}
                <div className="mt-4 text-xs text-muted hidden sm:block">
                  <div>Astuce : connectez-vous pour éditer ou supprimer ce projet.</div>
                </div>
              </aside>
            </div>
          </div>
        </div>

        {/* Edit panel (below on mobile, right column on desktop) */}
        <div className="card bg-base-100 p-4 shadow">
          <h2 className="text-lg font-semibold mb-3" id="edit">Éditer / Mettre à jour</h2>

          {user ? (
            canEdit ? (
              <ProjectFormServer authors={authors} initial={project} />
            ) : (
              <div className="p-4 rounded bg-base-200">
                <p className="text-sm text-muted">Vous n'avez pas les droits nécessaires pour modifier ce projet.</p>
              </div>
            )
          ) : (
            <div className="p-4 rounded bg-base-200 space-y-3">
              <p className="text-sm">Pour éditer ce projet, <strong>connectez-vous</strong> ou <strong>créez un compte</strong>.</p>
              <div className="flex gap-2">
                <Link href="/signin" className="btn btn-primary btn-sm">Se connecter</Link>
                <Link href="/register" className="btn btn-ghost btn-sm">S'inscrire</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
