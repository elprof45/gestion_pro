import {
  type InferUITools,
  type ToolSet,
  type UIDataTypes,
  type UIMessage,
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
} from "ai";
import { z } from "zod";
import { groq } from '@ai-sdk/groq';
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Helpers : récupération utilisateur (optionnelle)
 */
async function getCurrentUserOrNull() {
  try {
    const session = await auth();
    if (!session?.user?.email) return null;

    const me = await prisma.user.findUnique({ where: { email: session.user.email } });

    if (!me) return null;
    return me;
  } catch (e) {
    return null;
  }
}


/* Exports types utiles pour le front / UI */
export type ChatTools = InferUITools<typeof tools>;
export type ChatMessage = UIMessage<never, UIDataTypes, ChatTools>;

/* ---------------------------
   Route handler
   --------------------------- */
export async function POST(req: Request) {
  try {
    const { messages } = (await req.json()) as { messages: ChatMessage[] };

    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Payload invalid: messages attendu" }), { status: 400 });
    }

    const result = streamText({
      model: groq('moonshotai/kimi-k2-instruct-0905'),
      system: "You are a helpful assistant. Réponds en français si l'utilisateur écrit en français. Tu es la pour vous assister dans la gestion de vos projets. demander moi de creer un projet avec titre, description, statut, l'ideée ,la date d'échéance",
      messages: convertToModelMessages(messages),
      stopWhen: stepCountIs(10),
      tools,
    });

    return result.toUIMessageStreamResponse({
      onError(err) {
        if (!err) return "unknown error";
        if (typeof err === "string") return err;
        if (err instanceof Error) return err.message;
        return String(err);
      },
    });
  } catch (err: any) {
    console.error("API /chat error:", err);
    return new Response(JSON.stringify({ error: err?.message ?? "server error" }), { status: 500 });
  }
}


/* ---------------------------
   Zod schemas 
   --------------------------- */
const ProjectStatusEnum = z
  .enum(["IDEA", "IN_PROGRESS", "REVIEW", "DONE"])
  .describe("Statut du projet : IDEA | IN_PROGRESS | REVIEW | DONE");

const CreateProjectSchema = z
  .object({
    titre: z.string().min(1).describe("Titre du projet (non vide)"),
    description: z.string().optional().nullable().describe("Description du projet"),
    status: ProjectStatusEnum.optional().default("IDEA").describe("Statut initial"),
    date_de_echeance: z
      .string()
      .optional()
      .nullable()
      .describe("Date d'échéance au format 'YYYY-MM-DD'"),
    authorIds: z.array(z.string()).optional().describe("Liste d'IDs d'auteurs à associer (optionnel)"),
  })
  .describe("Schéma d'entrée pour la création d'un projet");

// Schéma unifié pour la recherche (remplace SearchFilter, StatusQuery, AuthorQuery)
const FindProjectsSchema = z.object({
  query: z.string().min(1).optional().describe("Texte de recherche libre (titre, description, ou date)."),
  status: ProjectStatusEnum.optional().describe("Filtrer par statut exact (IDEA / IN_PROGRESS / REVIEW / DONE)."),
  authorName: z.string().optional().describe("Filtrer par auteur (par nom partiel)."),
}).describe("Paramètres pour rechercher, lister ou résumer des projets.");


const ProjectLookupSchema = z.object({
  inputOfSearch: z.string().min(1).describe("Titre complet ou partiel, description ou date pour trouver un projet"),
}).describe("Trouver un projet par titre/description/date");

/* ---------------------------
   Tools implementation
   --------------------------- */
const createProjectTool = tool({
  description:
    "Créer un projet avec titre, description, statut, l'ideée ,la date d'échéance et des auteurs associés.",
  inputSchema: CreateProjectSchema,
  execute: async ({
    titre,
    description,
    status,
    date_de_echeance,
    authorIds,
  }: z.infer<typeof CreateProjectSchema>) => {
    // permission check
    const me = await getCurrentUserOrNull();
    // debug
    console.log("*** utilisation du fonction ## createProjectTool (Créer un projet avec titre, description, statut, l'idée, la date d'échéance et des auteurs associés.)");
    if (!me) {
      throw new Error("Authentification requise pour créer un projet.");
    }

    // normaliser date_de_echeance
    let dateDeEcheance: Date | undefined = undefined;
    if (date_de_echeance) {
      const d: Date = new Date(date_de_echeance);
      if (!isNaN(d.getTime())) dateDeEcheance = d;
    }

    // vérifier / filtrer authorIds existants
    let validAuthorIds: string[] | undefined = undefined;
    if (authorIds && authorIds.length) {
      // S'assurer que les IDs existent et ne contiennent pas l'ID de l'auteur principal
      const found: { id: string }[] = await prisma.author.findMany({
        where: { id: { in: authorIds } },
        select: { id: true },
      });
      validAuthorIds = found.map((f: { id: string }) => f.id);
    }


    const created = await prisma.project.create({
      data: {
        title: titre,
        description: description ?? null,
        status: status,
        dueDate: dateDeEcheance,
        authorPrincipal: me.name, // assigne l'auteur principal (ID non null)
        authors:
          validAuthorIds && validAuthorIds.length
            ? { create: validAuthorIds.map((authorId: string) => ({ authorId })) }
            : undefined,
      },
      include: { authors: { include: { author: true } } },
    });

    // audit optionnel (si table audit existe)
    try {
      await prisma.audit?.create?.({
        data: {
          actorId: me.id,
          action: "createProject",
          resourceId: created.id,
          meta: { title: created.title },
        } as any,
      });
    } catch (e: any) {
      /* ignore if audit table missing */
    }
    revalidatePath('/',"page")
    return { project: created };
  },
});


const findProjectsTool = tool({
  description:
    "Recherche, liste ou trouve les projets. Utilise les filtres par texte, titre, statut et/ou date d'échéance.",
  inputSchema: FindProjectsSchema,
  execute: async (input) => {
    const me = await getCurrentUserOrNull();
    // debug
    console.log("*** utilisation du fonction ## findProjectsTool (Recherche, liste ou trouve les projets. Utilise les filtres par texte, titre, statut et/ou date d'échéance.)");
    if (!me) {
      return { projects: [], counts: {}, summary: "Erreur: Authentification requise pour effectuer cette recherche." };
    }

    const limit = Math.min(Number(20), 50);

    // Filtre d'autorisation obligatoire: l'utilisateur doit être principal ou associé
    const authFilter = {
      OR: [
        { authorPrincipal: me.name },
      ]
    };

    const filters: any[] = [];
    const orClauses: any[] = [];

    // 1. Traitement de la recherche textuelle (input.query)
    if (input.query) {
      const q = input.query;
      // Si q correspond à un statut exact
      if (["IDEA", "IN_PROGRESS", "REVIEW", "DONE"].includes(q.toUpperCase())) {
        filters.push({ status: q.toUpperCase() });
      } else {
        // Recherche textuelle sur titre/description/date
        orClauses.push({ title: { contains: q } });
        orClauses.push({ description: { contains: q } });
        const maybeDate = new Date(q);
        if (!isNaN(maybeDate.getTime())) {
          const iso = maybeDate.toISOString().slice(0, 10);
          orClauses.push({ dueDate: { equals: new Date(iso) } });
        }
      }
    }

    // 2. Traitement du statut explicite
    if (input.status) {
      filters.push({ status: input.status });
    }

    // 3. Traitement du filtre par auteur
    if (input.authorName) {
      filters.push({ authorPrincipal: { contains: input.authorName } });
    }

    // 4. Ajout des clauses OR (recherche textuelle libre) s'il y en a
    if (orClauses.length) {
      filters.push({ OR: orClauses });
    }

    // 5. Composition finale de la clause WHERE: AuthFilter AND tous les autres filtres
    const where: any = filters.length > 0 ? { AND: [authFilter, ...filters] } : authFilter;

    // Sélection des projets (respectant l'autorisation)
    const projects = await prisma.project.findMany({
      where,
      take: limit,
      orderBy: { updatedAt: "desc" },
      include: { authors: { include: { author: true } } },
    });

    // Counts par statut (respectant l'autorisation)
    const counts = await prisma.project.groupBy({
      where: authFilter,
      by: ["status"],
      _count: { _all: true },
    }).catch(() => []);

    const total = projects.length;
    const summaryLines: string[] = [];

    summaryLines.push(`Voici les projets correspondant à votre requête (${me.name ?? me.email}).`);

    if (input.status) summaryLines.push(`Filtre statut : ${input.status}.`);
    if (input.authorName) summaryLines.push(`Filtre auteur : ${input.authorName}.`);
    summaryLines.push(`Résultats : ${total} projet(s) affiché(s) (limite ${limit}).`);


    projects.forEach((p) => {
      const authorsNames = p.authors?.map((a) => a.author?.name).filter(Boolean).slice(0, 3).join(", ");
      const due = p.dueDate ? new Date(p.dueDate).toISOString().slice(0, 10) : "sans date";
      const shortDesc = p.description ? (p.description.length > 120 ? p.description.slice(0, 120) + "..." : p.description) : "—";
      summaryLines.push(`• ${p.title} — ${p.status} — ${due} — auteurs: ${authorsNames || "—"} — ${shortDesc}`);
    });

    const countsMap: Record<string, number> = {};
    (counts as any[]).forEach((c) => { countsMap[c.status] = c._count?._all ?? 0; });

    const summaryText = summaryLines.join("\n");

    return {
      projects,
      counts: countsMap,
      summary: summaryText,
    };
  },
});


const projectDetailsTool = tool({
  description: "Donne des détails sur un projet (titre/description/date) ou parle d'un projet par le titre/description/date et retourne ses détails complets.",
  inputSchema: ProjectLookupSchema,
  execute: async (inputOfSearch) => {
    const me = await getCurrentUserOrNull();
    // debug
    console.log("*** utilisation du fonction ## projectDetailsTool (Donne des détails sur un projet (titre/description/date) ou parle d'un projet par le titre/description/date et retourne ses détails complets.)");
    if (!me) {
      return { project: null, summary: "Authentification requise." };
    }

    const authFilter = {
      OR: [
        { authorPrincipal: me.name },
      ]
    };

    // Helper pour combiner la recherche avec l'autorisation obligatoire
    const buildWhere = (searchCriteria: any) => ({
      AND: [searchCriteria, authFilter]
    });

    let project = null;

      const partialSearchCriteria = {
        OR: [
          { title: { contains: inputOfSearch.inputOfSearch } },
          { description: { contains: inputOfSearch.inputOfSearch } },
        ]
      };

      project = await prisma.project.findFirst({
        where: buildWhere(partialSearchCriteria),
        include: { authors: { include: { author: true } } },
      });

    // 3. Recherche par date (si non trouvé et doit respecter authFilter)
    if (!project) {
      const maybeDate = new Date(inputOfSearch.inputOfSearch);
      if (!isNaN(maybeDate.getTime())) {
        const dateSearchCriteria = { dueDate: { equals: new Date(maybeDate.toISOString().slice(0, 10)) } };

        project = await prisma.project.findFirst({
          where: buildWhere(dateSearchCriteria),
          include: { authors: { include: { author: true } } },
        });
      }
    }

    if (!project) {
      return { project: null, summary: `Aucun projet trouvé pour "${inputOfSearch.inputOfSearch}" (parmi ceux dont vous êtes auteur).` };
    }

    // build full textual summary
    const authorsNames = project.authors?.map((a) => a.author?.name).filter(Boolean).join(", ") || "—";
    const due = project.dueDate ? new Date(project.dueDate).toISOString().slice(0, 10) : "sans date";
    const summary = `Projet "${project.title}" — statut: ${project.status} — échéance: ${due} — auteurs: ${authorsNames}. Description: ${project.description ?? "—"}`;

    return { project, summary };
  },
});

/* ---------------------------
   Définition des tools
   --------------------------- */

export const tools = {
  createProject: createProjectTool,
  findProjects: findProjectsTool, // Outil unique de recherche/liste/résumé
  projectDetails: projectDetailsTool,
} satisfies ToolSet;