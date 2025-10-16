import { Author } from '@prisma/client'
import { createProjectAction, updateProjectAction } from '@/actions/actions'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Field, FieldGroup, FieldLabel } from './ui/field'
import { Checkbox } from './ui/checkbox'
import { Button } from './ui/button'
import ActionButton from './ui/ActionButton'


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
      className="space-y-4 card p-6 shadow-md rounded-xl border border-primary/50 "
    >
      {estEdition && (
        <input type="hidden" name="id" defaultValue={initial.id} />
      )}

      {/* --- Titre --- */}
      <div className="grid w-full max-w-sm items-center gap-3">
        <Label htmlFor="title"> <span className="font-semibold">Titre du projet</span></Label>
        <Input id="title" name="title"
          defaultValue={initial?.title ?? ''}
          placeholder="Ex : Nouvelle application mobile"
          required />
      </div>

      {/* --- Description --- */}
      <Label htmlFor="description" className="mb-2">
        <span className="font-semibold">Description</span>
      </Label>
      <Textarea
        id="description"
        name="description"
        defaultValue={initial?.description ?? ""}
        placeholder="Décris brièvement le but ou le contenu du projet..."
        rows={4}
        className="resize-none overflow-auto max-h-32"
      />

      {/* --- Statut et Date --- */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Field>
            <FieldLabel htmlFor="status">
              Statut
            </FieldLabel>
            <Select defaultValue={initial?.status ?? "IDEA"} name="status">
              <SelectTrigger id="status">
                <SelectValue placeholder={initial?.status ?? "IDEA"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IDEA">Idée</SelectItem>
                <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                <SelectItem value="REVIEW">À revoir</SelectItem>
                <SelectItem value="DONE">Terminé</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="flex-1">
          <Label htmlFor="date" className="mb-4">
            <span className="font-semibold">Date d’échéance</span>
          </Label>
          <Input
            id="date"
            type="date"
            name="dueDate"
            defaultValue={
              initial?.dueDate
                ? new Date(initial.dueDate).toISOString().slice(0, 10)
                : ''
            }
          />
        </div>
      </div>

      {/* --- Auteurs --- */}
      <div>
        <Label htmlFor="author" className="mb-4">
          <span className="font-semibold">Auteurs associés</span>
        </Label>
        <div className="flex flex-wrap gap-3">
          {authors.map((a) => (
            <FieldGroup key={a.id}>
              <Field orientation="horizontal" >
                <Checkbox
                  name="authorIds"
                  value={a.id}
                  defaultChecked={initial?.authors?.some(
                    (pa: any) => pa.authorId === a.id
                  )} />
                <FieldLabel
                  htmlFor="checkout-7j9-same-as-shipping-wgm"
                  className="font-normal"
                >
                  {a.name}
                </FieldLabel>
              </Field>
            </FieldGroup>
          ))}
        </div>

      </div>

      {/* --- Boutons d’action --- */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="reset" variant={'secondary'}>
          Annuler
        </Button>
         <ActionButton >{estEdition ? 'Mettre à jour le projet' : 'Créer le projet'}</ActionButton>
      </div>
    </form>
  )
}
