export interface ResponseDTO<T> {
  pagination: Pagination;
  rows: T[];
  summary: Summary;
}

export class Pagination {
  page: number;
  cantpages?: number;
  cantpagesArray?: number[];
  count: number;
  pages: number;
  size: number;

  constructor() {
    this.page = 1;
    this.cantpages = 0;
    this.count = 0;
    this.pages = 0;
    this.size = 0;
  }
}

export interface Summary {
  total?: number,
  electronicInvoiceTotal?: number,
  creditNotesTotal?: number,
  loan?: number,
  pickups?: number,
  pettyCash?: number,
  tenders?:  string,
  qtyTransactions?: number,
  soldItems?: number,
  trxCount?: number;
  others?: any;
}
