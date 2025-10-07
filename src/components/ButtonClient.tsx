"use client";
function ButtonClient() {
    return (
        <div>
            <button
                type="submit"
                className="btn btn-error"
                onClick={(ev) => {
                    if (!confirm('Confirmer la suppression de ce projet ?')) ev.preventDefault()
                }}
            >
                Supprimer
            </button>
        </div>
    )
}

export default ButtonClient
