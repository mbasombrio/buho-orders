
export interface Department {
  id: number;
  fatherId: number;
  name: string;
  specialType: string;
  complexCode: string;
  text: string;
  children?: Department[];
}


export class DepartmentFilter {
  public name: string | null;
  public fatherId: number | null;
  public code: number | null;

  constructor() {
    this.name = null;
    this.code = null;
    this.fatherId = null;
  }
}
