'use client';
import Link from 'next/link';
import { format } from 'date-fns';

export default function ProjectCard({ project }: { project: any }) {
  const authors = project.authors?.map((pa: any) => pa.author) ?? []
  return (
    <Link href={`/projects/${project.id}`} className="card bg-base-100 shadow hover:shadow-lg transition group">
      <div className="card-body">
        <div className="flex justify-between">
          <h3 className="card-title">{project.title}</h3>
          <div className="badge badge-outline">{project.status}</div>
        </div>
        <p className="text-sm text-muted line-clamp-3">{project.description ?? '—'}</p>
        <div className="mt-3 flex items-center gap-2">
          {authors.slice(0,3).map((a:any) => (
            <div key={a.id} className="badge badge-sm">{a.name.split(' ')[0]}</div>
          ))}
          <div className="ml-auto text-xs text-muted">{project.dueDate ? format(new Date(project.dueDate), 'dd/MM/yyyy') : 'Pas de date'}</div>
        </div>
      </div>
    </Link>
  )
}
