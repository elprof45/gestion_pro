'use client';
import Link from 'next/link';
import { format } from 'date-fns';

export default function ProjectCard({ project }: { project: any }) {
  const authors = project.authors?.map((pa: any) => pa.author) ?? [];

  return (
    <Link
      href={`/projects/${project.id}`}
      className="
        block
        rounded-xl
        border border-base-300
        bg-base-100
        shadow-md
        hover:shadow-xl
        hover:border-primary/50
        hover:bg-base-200
        transition-all
        duration-300
        group
        overflow-hidden
      "
    >
      <div className="card-body p-5">
        {/* Titre + statut */}
        <div className="flex justify-between items-start">
          <h3 className="card-title text-lg font-semibold group-hover:text-primary transition-colors">
            {project.title}
          </h3>
          <div
            className={`badge ${
              project.status === 'En cours'
                ? 'badge-info'
                : project.status === 'Terminé'
                ? 'badge-success'
                : 'badge-outline'
            }`}
          >
            {project.status}
          </div>
        </div>

        {/* Description */}
        <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
          {project.description ?? '—'}
        </p>

        {/* Auteurs + date */}
        <div className="mt-4 flex items-center gap-2">
          {authors.slice(0, 3).map((a: any) => (
            <div
              key={a.id}
              className="badge badge-sm badge-neutral bg-base-300 border-none text-xs font-medium"
            >
              {a.name.split(' ')[0]}
            </div>
          ))}

          <div className="ml-auto text-xs text-muted-foreground italic">
            {project.dueDate
              ? format(new Date(project.dueDate), 'dd/MM/yyyy')
              : 'Pas de date'}
          </div>
        </div>
      </div>
    </Link>
  );
}
