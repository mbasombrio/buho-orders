import { Branch } from "./branch";

export class User {
  public id: number;
  public userName: string;
  public password: string;
  public passVerify: string;
  public name: string;
  public email: string;
  public cellphone: string;
  public role: number;
  public roleDescription: string;
  public enabled: boolean;
  public branches: Branch[];
  public client: string | null;
  restrictions: object | null;

  constructor() {
    this.id = 0;
    this.userName = '';
    this.password = '';
    this.passVerify = '';
    this.name = '';
    this.email = '';
    this.cellphone = '';
    this.role = 1;
    this.roleDescription = '';
    this.enabled = true;
    this.branches = [];
    this.client = null;
    this.restrictions = null;
  }
}

export class UserFilter {
  public name: string;
  public enabled: string;
  public page: number;

  constructor() {
    this.name = '';
    this.page = 1;
    this.enabled = 'SI';
  }
}

