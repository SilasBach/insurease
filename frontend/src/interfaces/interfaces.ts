export interface UserState {
  token: string;
  user_id: string;
  role: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  bureauAffiliation: string;
  role: string;
  accountStatus: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
