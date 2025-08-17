import { Deposit } from "./deposit";

export class Branch {
   public id: number;
   public businessName: string;
   public address: string;
	public locality: string;
	public contact: string;
	public contactPhone: string;
	public contactEmail: string;
	public alternativeContactEmail: string;
	public afipCondition: string;
	public responsible: string;
   public cuit: string;
   public deposits: Deposit[];
   
   constructor(){
      this.id = 0;
      this.businessName = '';
      this.address = '';
      this.locality = '';
      this.contact = '';
      this.contactPhone = '';
      this.contactEmail = '';
      this.alternativeContactEmail = '';
	   this.afipCondition = '';
	   this.responsible = '';
      this.cuit = '';
      this.deposits = [];
   }
}

export class BranchFilter{
   public businessName: string;
   public responsible: string;
   public page: number;

   constructor(){
      this.businessName = '';
      this.responsible = '';
      this.page = 1;
   }
}