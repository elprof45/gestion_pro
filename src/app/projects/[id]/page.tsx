// app/projects/[id]/page.tsx  (ou le chemin que tu utilises)
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProjectFormServer from "@/components/ProjectFormServer";
import { format } from "date-fns";
import { auth } from "@/lib/auth";
import { deleteProjectAction } from "@/actions/actions";

// shadcn UI primitives — assure-toi qu'ils existent dans ton projet
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import ActionButton from "@/components/ui/ActionButton";

function statusBadgeClass(status: string) {
  switch (status) {
    case "IN_PROGRESS":
      return {
        text: "En cours",
        className:
          "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
      };
    case "REVIEW":
      return {
        text: "À revoir",
        className:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700",
      };
    case "DONE":
      return {
        text: "Terminé",
        className:
          "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border border-green-200 dark:border-green-800",
      };
    default:
      return {
        text: "Idée",
        className:
          "bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300 border border-gray-200 dark:border-gray-700",
      };
  }
}


function initials(name?: string) {
  if (!name) return "??";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default async function ProjectPage({ params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: { authors: { include: { author: true } } },
  });

  const authors = await prisma.author.findMany();
  const current = await auth();
  const user = current?.user ? { ...current.user, role: (current.user as any).role } : null;

  if (!project) {
    return (
      <main className="max-w-4xl mx-auto py-12 px-4 h-screen">
        <Card>
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold">Projet non trouvé</h2>
            <p className="mt-3 text-muted-foreground">
              Le projet recherché n'existe pas ou a été supprimé.
            </p>

            <div className="mt-6 flex gap-3">
              <Link href="/">
                <Button variant="ghost">Retour au tableau</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  const canEdit = user && (user.role === "MANAGER" || user.role === "ADMIN");
  const canDelete = user && (user.role === "MANAGER" || user.role === "ADMIN");
  // const canDelete = user && user.role === "ADMIN";
  const statusBadge = statusBadgeClass(project.status);

  return (
    <main className="max-w-6xl mx-auto py-8 px-4">
      {/* Top / Breadcrumb */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
        <div>
          <nav aria-label="Breadcrumb" className="text-sm">
            <ol className="flex items-center gap-2 text-muted-foreground">
              <li>
                <Link href="/" className="hover:underline">
                  Tableau
                </Link>
              </li>
              <li> / </li>
              <li>
                <Link href="/" className="hover:underline">
                  Projets
                </Link>
              </li>
              <li> / </li>
              <li className="text-foreground font-medium truncate max-w-xs">{project.title}</li>
            </ol>
          </nav>
          {/* 
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{project.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{project.description ?? "Aucune description fournie."}</p> */}
        </div>

        <div className="flex items-center gap-3">
          <Badge
            className={`px-3 py-2 text-sm font-medium rounded-md ${statusBadge.className}`}
          >
            {statusBadge.text}
          </Badge>

          {project.dueDate && (
            <div className="text-sm text-muted-foreground">
              Échéance : <span className="font-medium text-foreground">{format(new Date(project.dueDate), "dd/MM/yyyy")}</span>
            </div>
          )}

          <Separator orientation="vertical" className="h-6" />

          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="outline" size="sm">Retour</Button>
            </Link>
            {/* {canEdit && (
              <a href="#edit">
                <Button size="sm">Éditer</Button>
              </a>
            )} */}
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left / Main column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold leading-tight">{project.title}</h2>
                      <p className="mt-2 text-sm text-muted-foreground">{project.description ?? "Aucune description fournie."}</p>
                    </div>
                  </div>

                  {/* Authors */}
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3"><span className="font-semibold">Auteurs associés</span></h3>
                    <div className="flex flex-wrap items-center gap-4">
                      {project.authors.length > 0 ? (
                        project.authors.map((pa: any) => (
                          <div key={pa.author.id} className="flex items-center gap-3">
                            <Avatar>
                              {pa.author.avatarUrl ? (
                                <AvatarImage src={pa.author.avatarUrl} alt={pa.author.name} />
                              ) : (
                                <AvatarFallback className="bg-muted-foreground text-white">
                                  {initials(pa.author.name)}
                                </AvatarFallback>
                              )}
                            </Avatar>

                            <div>
                              <div className="text-sm font-medium">{pa.author.name}</div>
                              {pa.author.email && <div className="text-xs text-muted-foreground">{pa.author.email}</div>}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground">Aucun auteur associé.</div>
                      )}
                    </div>
                  </div>

                  {/* Created / Updated */}
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-lg border p-4 bg-muted-foreground/5">
                      <div className="text-xs text-muted-foreground">Créé par <span className="font-medium">{project.authorPrincipal}</span></div>
                      <div className="text-sm font-medium">le {new Date(project.createdAt).toLocaleString()}</div>
                    </div>

                    <div className="rounded-lg border p-4 bg-muted-foreground/5">
                      <div className="text-xs text-muted-foreground">Dernière mise à jour</div>
                      <div className="text-sm font-medium">le {new Date(project.updatedAt).toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    {canDelete ? (<form action={deleteProjectAction}>
                      <input type="hidden" name="id" value={project.id} />
                      <ActionButton variant="destructive">Suprimer</ActionButton>
                    </form>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild></TooltipTrigger>
                        <TooltipContent>Vous n'avez pas les droits nécessaires pour supprimer ce projet.</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Extra cards / sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Détails</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mt-2 text-sm text-muted-foreground">Auteur : {project.authorPrincipal ?? "Inconnu"}</p>
                <p className="text-sm text-muted-foreground">Statut :  <Badge
                  className={`px-3 py-2 text-sm font-medium rounded-md ${statusBadge.className}`}
                >
                  {statusBadge.text}
                </Badge></p>
                <p className="mt-2 text-sm text-muted-foreground">Category : {(project as any).category ?? "Général"}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Aucune note pour le moment.</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right column: edit panel */}
        <aside>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">Éditer / Mettre à jour</CardTitle>
            </CardHeader>

            <CardContent>
              {user ? (
                canEdit ? (
                  <div id="edit">
                    <ProjectFormServer authors={authors} initial={project} />
                  </div>
                ) : (
                  <div className="rounded-md p-4 bg-muted-foreground/5">
                    <p className="text-sm text-muted-foreground">Vous n'avez pas les droits nécessaires pour modifier ce projet.</p>
                  </div>
                )
              ) : (
                <div className="space-y-3">
                  <p className="text-sm">Pour éditer ce projet, <strong>connectez-vous</strong> ou <strong>créez un compte</strong>.</p>
                  <div className="flex gap-2">
                    <Link href="/login">
                      <Button>Se connecter</Button>
                    </Link>
                    <Link href="/signup">
                      <Button variant="ghost">S'inscrire</Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
