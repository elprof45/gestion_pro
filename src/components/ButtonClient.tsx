"use client";
function ButtonClient() {
    return (
        <button
            type="submit"
            className="btn btn-error"
            onClick={(ev) => {
                if (!confirm('Confirmer la suppression de ce projet ?')) ev.preventDefault()
            }}
        >
            Supprimer
        </button>
    )
}

export default ButtonClient
