'use client';
import Link from 'next/link';
import { format } from 'date-fns';

export default function ProjectCard({ project }: { project: any }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="
        block
        rounded-xl
        border border-base-300
        shadow-md
        hover:shadow-xl
        hover:border-primary/50
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
            {project.title.length > 10
              ? project.title.slice(0, 10) + '...'
              : project.title}
          </h3>
            {(() => {
            let statusText = '';
            let statusColorClass = '';

            switch (project.status) {
              case 'IN_PROGRESS':
              statusText = 'En_cours';
              statusColorClass = 'bg-yellow-500 text-white';
              break;
              case 'DONE':
              statusText = 'Terminés';
              statusColorClass = 'bg-green-500 text-white';
              break;
              case 'IDEA': // Assuming 'PENDING' maps to 'Idées'
              statusText = 'Idées';
              statusColorClass = 'bg-blue-500 text-white';
              break;
              case 'REVIEW': // Assuming 'REVIEW' maps to 'À revoir'
              statusText = 'À revoir';
              statusColorClass = 'bg-orange-500 text-white';
              break;
              default:
              // Fallback for any other status not explicitly handled
              statusText = project.status; // Displays original status if unknown
              statusColorClass = 'bg-gray-500 text-white';
              break;
            }

            return (
              <div className={`badge p-2 m-2 text-xs ${statusColorClass}`}>
              {statusText}
              </div>
            );
            })()}
        </div>

        {/* Description */}
        <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
          {project.description ?? '—'}
        </p>

        {/* Auteurs + date */}
        <div className="mt-4 flex items-center gap-2">
            <div className="badge badge-sm badge-neutral bg-base-300 border-none text-xs font-medium px-2">
              {project.authorPrincipal.split(' ')[0]}
            </div>
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
