export type User = {
  id: string;
  email: string;
  name: string;
  role: boolean;
};

export type ContributionForm = {
  title: string;
  description?: string;
  status?: string;
};
export enum Role {
  USER,
  MANAGER,
  ADMIN
}