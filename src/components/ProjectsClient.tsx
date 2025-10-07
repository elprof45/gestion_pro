'use client'
import { useEffect, useState } from 'react';
import ProjectCard from './ProjectCard';

export default function ProjectsClient({ initialProjects }: { initialProjects: any[] }) {
  const [projects, setProjects] = useState(initialProjects || [])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [debounceTimer, setDebounceTimer] = useState<any>(null)

  useEffect(() => {
    setProjects(initialProjects || [])
  }, [initialProjects])

  useEffect(() => {
    // debounced fetch
    if (debounceTimer) clearTimeout(debounceTimer)
    const t = setTimeout(() => {
      fetchProjects()
    }, 350)
    setDebounceTimer(t)
    return () => clearTimeout(t)
  }, [search, status])

  async function fetchProjects() {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    const res = await fetch('/api/projects?' + params.toString())
    if (res.ok) {
      const data = await res.json()
      setProjects(data)
    } else {
      // handle error (e.g., not auth)
      console.error('Erreur recherche projets')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Recherche par titre..." className="input input-bordered w-1/2" />
        <select value={status} onChange={e => setStatus(e.target.value)} className="select select-bordered">
          <option value="">Tous status</option>
          <option value="IDEA">IDEA</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="REVIEW">REVIEW</option>
          <option value="DONE">DONE</option>
        </select>
        <div className="ml-auto text-sm text-muted">{loading ? 'Chargement...' : <button className="btn btn-ghost" onClick={() => { setSearch(''); setStatus('') }}>Effacer</button>
        }</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {projects.map(p => <ProjectCard key={p.id} project={p} />)}
      </div>
    </div>
  )
}
