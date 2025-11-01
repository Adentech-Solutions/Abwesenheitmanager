export interface GraphUser {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
  givenName?: string;
  surname?: string;
  jobTitle?: string;
  department?: string;
  officeLocation?: string;
}

export interface GraphManager {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
}