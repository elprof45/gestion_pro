import { Author } from '@prisma/client'
import { createProjectAction, updateProjectAction } from '../actions/actions'

type Props = {
  authors: Author[]
  initial?: any
}

export default async function FormulaireProjetServer({ authors, initial }: Props) {
  const estEdition = Boolean(initial && initial.id)
  const action = estEdition ? updateProjectAction : createProjectAction

  return (
    <form
      action={action}
      className="space-y-4 card bg-base-100 p-6 shadow-md rounded-xl border border-base-300"
    >
      {estEdition && (
        <input type="hidden" name="id" defaultValue={initial.id} />
      )}

      {/* --- Titre --- */}
      <div>
        <label className="label">
          <span className="label-text font-semibold">Titre du projet</span>
        </label>
        <input
          name="title"
          defaultValue={initial?.title ?? ''}
          className="input input-bordered w-full"
          placeholder="Ex : Nouvelle application mobile"
          required
        />
      </div>

      {/* --- Description --- */}
      <div>
        <label className="label">
          <span className="label-text font-semibold">Description</span>
        </label>
        <textarea
          name="description"
          defaultValue={initial?.description ?? ''}
          className="textarea textarea-bordered w-full"
          placeholder="Décris brièvement le but ou le contenu du projet..."
          rows={4}
        />
      </div>

      {/* --- Statut et Date --- */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="label">
            <span className="label-text font-semibold">Statut</span>
          </label>
          <select
            name="status"
            defaultValue={initial?.status ?? 'IDEA'}
            className="select select-bordered w-full"
          >
            <option value="IDEA">Idée</option>
            <option value="IN_PROGRESS">En cours</option>
            <option value="REVIEW">À revoir</option>
            <option value="DONE">Terminé</option>
          </select>
        </div>

        <div className="flex-1">
          <label className="label">
            <span className="label-text font-semibold">Date d’échéance</span>
          </label>
          <input
            type="date"
            name="dueDate"
            defaultValue={
              initial?.dueDate
                ? new Date(initial.dueDate).toISOString().slice(0, 10)
                : ''
            }
            className="input input-bordered w-full"
          />
        </div>
      </div>

      {/* --- Auteurs --- */}
      <div>
        <label className="label">
          <span className="label-text font-semibold">Auteurs associés</span>
        </label>
        <div className="flex flex-wrap gap-3">
          {authors.map((a) => (
            <label
              key={a.id}
              className="flex items-center gap-2 cursor-pointer select-none"
            >
              <input
                type="checkbox"
                name="authorIds"
                value={a.id}
                defaultChecked={initial?.authors?.some(
                  (pa: any) => pa.authorId === a.id
                )}
                className="checkbox checkbox-sm"
              />
              <span>{a.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* --- Boutons d’action --- */}
      <div className="flex justify-end gap-2 pt-2">
        <button type="reset" className="btn btn-ghost">
          Annuler
        </button>
        <button type="submit" className="btn btn-primary">
          {estEdition ? 'Mettre à jour le projet' : 'Créer le projet'}
        </button>
      </div>
    </form>
  )
}
