export function statusBadgeClass(status: string) {
  switch (status) {
    case "IN_PROGRESS":
      return {
        text: "En cours",
        className:
          "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
      };
    case "REVIEW":
      return {
        text: "À revoir",
        className:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700",
      };
    case "DONE":
      return {
        text: "Terminé",
        className:
          "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border border-green-200 dark:border-green-800",
      };
    default:
      return {
        text: "Idée",
        className:
          "bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300 border border-gray-200 dark:border-gray-700",
      };
  }
}
