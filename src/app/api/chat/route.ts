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
import { prisma } from "@/lib/prisma"; // adapte le chemin si besoin
import { auth } from "@/lib/auth"; // ta méthode server-side pour récupérer la session utilisateur

// NOTE: Prisma requires Node runtime — si ton hébergeur supporte edge, change ici si nécessaire.
// export const runtime = "edge";
export const runtime = "nodejs";

/**
 * Helpers : récupération utilisateur (optionnelle)
 * - Retourne l'objet utilisateur si authentifié et trouvé dans la BDD.
 * - Retourne null si la session est manquante ou l'utilisateur non trouvé, sans lever d'erreur.
 */
async function getCurrentUserOrNull() {
  try {
    const session = await auth();
    if (!session?.user?.email) return null;
    
    // Assurez-vous que l'email est unique pour la recherche.
    const me = await prisma.user.findUnique({ where: { email: session.user.email } });
    
    if (!me) return null;
    return me;
  } catch (e) {
    // Si auth() ou prisma échoue pour une raison autre, on retourne null.
    // Console.error est recommandé ici pour débugger les échecs silencieux.
    // console.error("Error fetching current user:", e);
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

    // retourne la response stream-compatible pour ai-elements / useChat
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
   Zod schemas pour les nouveaux tools
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

const SearchFilterSchema = z.object({
  query: z.string().min(1).optional().describe("Texte de recherche pour titre/description/status/date"),
  status: z.enum(["IDEA", "IN_PROGRESS", "REVIEW", "DONE"]).optional().describe("Filtrer par statut"),
  authorName: z.string().optional().describe("Filtrer par auteur (par nom partiel)"),
  limit: z.number().optional().default(20).describe("Nombre maximal de résultats à retourner"),
}).describe("Filtres génériques pour rechercher/summariser des projets");

const StatusQuerySchema = z.object({
  status: z.enum(["IDEA", "IN_PROGRESS", "REVIEW", "DONE"]).describe("Statut recherché"),
  limit: z.number().optional().default(50).describe("Nombre maximal de résultats à retourner"),
  // onlyMine retiré car l'autorisation est obligatoire
}).describe("Paramètres pour lister les projets par statut");

const AuthorQuerySchema = z.object({
  authorName: z.string().min(1).describe("Nom (ou partie) de l'auteur à rechercher"),
  limit: z.number().optional().default(50).describe("Nombre maximal de résultats à retourner"),
  // onlyMine retiré car l'autorisation est obligatoire
}).describe("Paramètres pour rechercher projets d'un auteur");

const ProjectLookupSchema = z.object({
  identifier: z.string().min(1).describe("Titre complet ou partiel, description ou date pour trouver un projet"),
  allowPartial: z.boolean().optional().default(true).describe("Autoriser la recherche partielle"),
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
    authorIds, // <-- Ajout de authorIds
  }: z.infer<typeof CreateProjectSchema>) => {
    // permission check
    const me = await getCurrentUserOrNull();
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
        where: { id: { in: authorIds, not: me.id } }, 
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
        authorPrincipal: me.id, // assigne l'auteur principal (ID non null)
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

    return { project: created };
  },
});

const summarizeProjectsTool = tool({
  description:
    "Résumé des projets correspondant à des filtres. Retourne un résumé textuel et une liste structurée. " +
    "Permet de filtrer par texte, statut, auteur (nom).",
  inputSchema: SearchFilterSchema,
  execute: async (input) => {
    const me = await getCurrentUserOrNull();

    if (!me) {
      return { projects: [], counts: {}, summary: "Erreur: Authentification requise pour effectuer cette recherche." };
    }
    
    const limit = Number(input.limit ?? 20); // Utilisation de la limite du schéma

    // Filtre d'autorisation obligatoire: l'utilisateur doit être principal ou associé
    const authFilter = {
      OR: [
        { authorPrincipal: me.id },
        { authors: { some: { authorId: me.id } } }
      ]
    };
    
    const filters: any[] = [];
    const orClauses: any[] = [];

    // 1. Traitement de la recherche textuelle (input.query)
    if (input.query) {
      const q = input.query;
      if (["IDEA", "IN_PROGRESS", "REVIEW", "DONE"].includes(q.toUpperCase())) {
        filters.push({ status: q.toUpperCase() });
      } else {
        orClauses.push({ title: { contains: q } });
        orClauses.push({ description: { contains: q } });
        const maybeDate = new Date(q);
        if (!isNaN(maybeDate.getTime())) {
          const iso = maybeDate.toISOString().slice(0, 10);
          filters.push({ dueDate: { equals: new Date(iso) } }); // Date exacte ajoutée comme filtre AND si unique
        }
      }
    }

    // 2. Traitement du statut explicite
    if (input.status) {
      filters.push({ status: input.status });
    }

    // 3. Traitement du filtre par auteur
    if (input.authorName) {
      filters.push({
        authors: {
          some: {
            author: {
              name: { contains: input.authorName },
            }
          }
        }
      });
    }

    // 4. Ajout des clauses OR (recherche textuelle) s'il y en a. Attention à la logique OR/AND
    if (orClauses.length) {
      // Si on a des OR (recherche titre/description), on les regroupe
      filters.push({ OR: orClauses });
    }
    

    // 5. Composition finale de la clause WHERE: AuthFilter AND tous les autres filtres
    // Si filters est vide, on utilise seulement authFilter
    const where: any = filters.length > 0 ? { AND: [authFilter, ...filters] } : authFilter;
    
    // Sélection des projets (respectant l'autorisation)
    const projects = await prisma.project.findMany({
      where,
      take: limit, // Limite appliquée
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
    summaryLines.push(`Résultats : ${total} projet(s) affiché(s) (limit ${limit}).`);


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

const projectsByStatusTool = tool({
  description: "Lister et résumer les projets d'un statut donné (IDEA / IN_PROGRESS / REVIEW / DONE).",
  inputSchema: StatusQuerySchema,
  execute: async (input) => {
    const me = await getCurrentUserOrNull();

    if (!me) {
      return { projects: [], summary: "Authentification requise.", count: 0 };
    }

    const limit = Number(input.limit ?? 50);

    const authFilter = {
      OR: [
        { authorPrincipal: me.id },
        { authors: { some: { authorId: me.id } } },
      ]
    };
    
    // La clause WHERE doit combiner le statut demandé ET le filtre d'autorisation.
    const where: any = {
      AND: [
        { status: input.status },
        authFilter
      ]
    };
    
    const list = await prisma.project.findMany({
      where,
      take: limit, // Utilisation de la limite du schéma
      orderBy: { updatedAt: "desc" },
      include: { authors: { include: { author: true } } },
    });

    const summaryLines = list.map((p) => {
      const authors = p.authors?.map((a) => a.author?.name).filter(Boolean).slice(0, 3).join(", ");
      const due = p.dueDate ? new Date(p.dueDate).toISOString().slice(0, 10) : "sans date";
      return `• ${p.title} — ${due} — auteurs: ${authors || "—"}`;
    });

    const summary = `Projets avec statut ${input.status} (${list.length} affichés)\n` + summaryLines.join("\n");

    return { projects: list, summary, count: list.length };
  },
});

const projectsByAuthorTool = tool({
  description: "Retourne les projets liés à un auteur (recherche par nom partiel).",
  inputSchema: AuthorQuerySchema,
  execute: async (input) => {
    const me = await getCurrentUserOrNull();

    if (!me) {
      return { projects: [], summary: "Authentification requise.", authors: [] };
    }
    
    const limit = Number(input.limit ?? 50); // Utilisation de la limite du schéma

    const authFilter = {
      OR: [
        { authorPrincipal: me.id },
        { authors: { some: { authorId: me.id } } }
      ]
    };

    // chercher l'auteur exact/partiel
    const authorsFound = await prisma.author.findMany({
      where: { name: { contains: input.authorName } },
      take: 20,
    });

    if (!authorsFound.length) {
      return { projects: [], summary: `Aucun auteur trouvé pour "${input.authorName}".`, authors: [] };
    }

    // récupérer projets associés à cet auteur
    const authorIds = authorsFound.map((a) => a.id);
    
    // Filtre 1: Le projet doit contenir l'un des auteurs recherchés
    const authorMatchFilter = { authors: { some: { authorId: { in: authorIds } } } };
    
    // La clause WHERE doit combiner le match Auteur ET le filtre d'autorisation de l'utilisateur ME
    const where: any = {
        AND: [
            authorMatchFilter,
            authFilter
        ]
    };

    const projects = await prisma.project.findMany({
      where,
      take: limit, // Limite appliquée
      orderBy: { updatedAt: "desc" },
      include: { authors: { include: { author: true } } },
    });

    const summary = `Trouvé ${projects.length} projet(s) pour l'auteur(s) "${input.authorName}" (parmi ceux que vous co-éditez).`;

    return { projects, authors: authorsFound, summary };
  },
});

const projectDetailsTool = tool({
  description: "Trouver un projet par titre/description/ date et retourner ses détails complets (auteurs inclus).",
  inputSchema: ProjectLookupSchema,
  execute: async (input) => {
    const me = await getCurrentUserOrNull();
    const q = input.identifier;
    const allowPartial = Boolean(input.allowPartial);

    if (!me) {
      return { project: null, summary: "Authentification requise." };
    }
    
    const authFilter = {
      OR: [
        { authorPrincipal: me.id },
        { authors: { some: { authorId: me.id } } }
      ]
    };

    // Helper pour combiner la recherche avec l'autorisation obligatoire
    const buildWhere = (searchCriteria: any) => ({
        AND: [searchCriteria, authFilter]
    });

    let project = null;

    // 1. Recherche exacte par titre (doit respecter authFilter)
    project = await prisma.project.findFirst({
      where: buildWhere({ title: { equals: q } }),
      include: { authors: { include: { author: true } } },
    });

    // 2. Recherche partielle si autorisée (doit respecter authFilter)
    if (!project && allowPartial) {
      const partialSearchCriteria = {
        OR: [
            { title: { contains: q } },
            { description: { contains: q } },
        ]
      };
      
      project = await prisma.project.findFirst({
        where: buildWhere(partialSearchCriteria),
        include: { authors: { include: { author: true } } },
      });
    }

    // 3. Recherche par date (si non trouvé et doit respecter authFilter)
    if (!project) {
      const maybeDate = new Date(q);
      if (!isNaN(maybeDate.getTime())) {
        const dateSearchCriteria = { dueDate: { equals: new Date(maybeDate.toISOString().slice(0, 10)) } };
        
        project = await prisma.project.findFirst({
          where: buildWhere(dateSearchCriteria),
          include: { authors: { include: { author: true } } },
        });
      }
    }

    if (!project) {
      return { project: null, summary: `Aucun projet trouvé pour "${q}" (parmi ceux dont vous êtes auteur).` };
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
  summarizeProjects: summarizeProjectsTool,
  projectsByStatus: projectsByStatusTool,
  projectsByAuthor: projectsByAuthorTool,
  projectDetails: projectDetailsTool,
} satisfies ToolSet;