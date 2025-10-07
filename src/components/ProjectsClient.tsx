'use client'

import { useEffect, useRef, useState } from 'react'
import ProjectCard from './ProjectCard'

type Projet = any // tu peux remplacer "any" par ton vrai type Prisma (ex: Project)

export default function ProjetsClient({ projetsInitiaux }: { projetsInitiaux: Projet[] }) {
  // États
  const [projets, setProjets] = useState<Projet[]>(projetsInitiaux ?? [])
  const [recherche, setRecherche] = useState<string>('')
  const [statut, setStatut] = useState<string>('') // '' = tous
  const [chargement, setChargement] = useState<boolean>(false)
  const [erreur, setErreur] = useState<string | null>(null)

  // refs pour le debounce et l’annulation de requête
  const attenteRef = useRef<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // quand la prop initiale change
  useEffect(() => {
    setProjets(projetsInitiaux ?? [])
  }, [projetsInitiaux])

  // relancer la recherche avec délai (debounce)
  useEffect(() => {
    if (attenteRef.current) {
      window.clearTimeout(attenteRef.current)
    }

    attenteRef.current = window.setTimeout(() => {
      chargerProjets()
    }, 350)

    return () => {
      if (attenteRef.current) {
        window.clearTimeout(attenteRef.current)
      }
      if (abortRef.current) {
        abortRef.current.abort()
        abortRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recherche, statut])

  // Fonction principale de récupération depuis l’API
  async function chargerProjets() {
    if (abortRef.current) {
      abortRef.current.abort()
    }
    const controller = new AbortController()
    abortRef.current = controller

    setChargement(true)
    setErreur(null)

    try {
      const params = new URLSearchParams()
      if (recherche) params.set('search', recherche)
      if (statut) params.set('status', statut)

      const res = await fetch('/api/projects?' + params.toString(), {
        signal: controller.signal,
      })

      if (!res.ok) throw new Error(`Erreur réseau ${res.status}`)

      const json = await res.json()
      const data = Array.isArray(json) ? json : json.data ?? []
      setProjets(data)
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error(err)
        setErreur('Impossible de charger les projets.')
      }
    } finally {
      setChargement(false)
      abortRef.current = null
    }
  }

  // Réinitialisation
  function reinitialiser() {
    setRecherche('')
    setStatut('')
    setProjets(projetsInitiaux ?? [])
    setErreur(null)
  }

  return (
    <div className="space-y-4">
      {/* Barre de recherche */}
      <div className="flex gap-2 items-center">
        <input
          aria-label="Recherche de projet"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher par titre ou description..."
          className="input input-bordered w-1/2"
        />

        <select
          aria-label="Filtrer par statut"
          value={statut}
          onChange={(e) => setStatut(e.target.value)}
          className="select select-bordered"
        >
          <option value="">Tous les statuts</option>
          <option value="IDEA">Idées</option>
          <option value="IN_PROGRESS">En cours</option>
          <option value="REVIEW">À revoir</option>
          <option value="DONE">Terminés</option>
        </select>

        <div className="ml-auto text-sm text-muted flex items-center gap-2">
          {chargement ? (
            <span>Chargement...</span>
          ) : (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={reinitialiser}
              aria-label="Effacer la recherche"
            >
              Effacer
            </button>
          )}
        </div>
      </div>

      {/* Erreur */}
      {erreur && <div className="text-error">{erreur}</div>}

      {/* Grille de projets */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {projets.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>

      {/* Aucun résultat */}
      {!chargement && projets.length === 0 && (
        <div className="text-center text-muted">Aucun projet trouvé.</div>
      )}
    </div>
  )
}
