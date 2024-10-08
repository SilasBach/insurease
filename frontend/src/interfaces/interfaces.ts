export interface BureauAffiliations {
  [key: string]: string;
}

export const BUREAU_AFFILIATIONS: BureauAffiliations = {
  TRYG: 'Tryg Forsikring',
  TOPDANMARK: 'Topdanmark',
  CODAN: 'Codan Forsikring',
  ALM_BRAND: 'Alm. Brand',
  IF_SKADE: 'If Skadeforsikring',
  GJENSIDIGE: 'Gjensidige Forsikring',
  LB: 'LB Forsikring',
  LAERERSTANDENS: 'Lærerstandens Brandforsikring',
  GF: 'GF Forsikring',
  KOBSTAEDERNES: 'Købstædernes Forsikring',
};

export interface UserState {
  token: string;
  user_id: string;
  role: string;
  policies?: { [key: string]: string[] };
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  bureauAffiliation?: string;
  accountStatus: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegistrationData extends LoginCredentials {
  fullName: string;
  bureauAffiliation: string;
}

export interface policies {
  id: string;
  filename: string;
  uploadDate: string;
}
