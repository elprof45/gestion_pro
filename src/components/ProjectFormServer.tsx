import { Author } from '@prisma/client'
import { createProjectAction, updateProjectAction } from '../actions/actions'

type Props = {
  authors: Author[]
  initial?: any
}

export default async function ProjectFormServer({ authors, initial }: Props){
  const isEdit = Boolean(initial && initial.id)
  const action = isEdit ?updateProjectAction:createProjectAction;


  return (
    <form action={action} className="space-y-3 card bg-base-100 p-4 shadow">
      {isEdit && <input type="hidden" name="id" defaultValue={initial.id} />}
      <div>
        <label className="label"><span className="label-text">Titre</span></label>
        <input name="title" defaultValue={initial?.title ?? ''} className="input input-bordered w-full" required />
      </div>

      <div>
        <label className="label"><span className="label-text">Description</span></label>
        <textarea name="description" defaultValue={initial?.description ?? ''} className="textarea textarea-bordered w-full" />
      </div>

      <div className="flex gap-2">
        <div className="w-1/2">
          <label className="label"><span className="label-text">Status</span></label>
          <select name="status" defaultValue={initial?.status ?? 'IDEA'} className="select select-bordered w-full">
            <option value="IDEA">IDEA</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="REVIEW">REVIEW</option>
            <option value="DONE">DONE</option>
          </select>
        </div>
        <div className="w-1/2">
          <label className="label"><span className="label-text">Date échéance</span></label>
          <input type="date" name="dueDate" defaultValue={initial?.dueDate ? new Date(initial.dueDate).toISOString().slice(0,10) : ''} className="input input-bordered w-full" />
        </div>
      </div>

      <div>
        <label className="label"><span className="label-text">Auteurs</span></label>
        <div className="flex gap-3 flex-wrap">
          {authors.map(a => (
            <label key={a.id} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="authorIds" value={a.id} defaultChecked={initial?.authors?.some((pa:any)=>pa.authorId===a.id)} className="checkbox" />
              <span>{a.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button type="reset" className="btn">Annuler</button>
        <button type="submit" className="btn btn-primary">{isEdit ? 'Mettre à jour' : 'Créer'}</button>
      </div>
    </form>
  )
}
