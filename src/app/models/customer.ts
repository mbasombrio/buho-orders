import { Branch } from './branch';
import { User } from './user';

export const ivaSituationConsumidorFinal = 'CONSUMIDOR_FINAL';
export class Customer {
	id?: number;
	dni?: string;
	name?: string;
	lastName?: string;
	email?: string;
	cellphone?: string;
	address?: string;
	zipCode?: string;
	city?: string;
	checkingAccountEnabled?: boolean;
	password?: string;
	totalRewardPoints?: number;
	listPrice?: number;
	user?: User;
	alternativePhone?: string;
	district?: string;
	state?: string;
	preferedContactTime?: string;
	enabled?: boolean;
	branch?: Branch;
	saldoFavor?: number;
	userName?: string;
	observation?: string;
	birthdayDate?: Date;
	ivaSituation?: string;
  status: string;
	ctaCteLimitAmount: number;
	customerType?: string;


	constructor() {
		this.id = undefined;
		this.dni = undefined;
		this.name = undefined;
		this.lastName = undefined;
		this.email = undefined;
		this.cellphone = undefined;
		this.address = undefined;
		this.zipCode = undefined;
		this.city = undefined;
		this.checkingAccountEnabled = undefined;
		this.password = '';
		this.totalRewardPoints = undefined;
		this.listPrice = 1;
		this.user = new User();
		this.alternativePhone = undefined;
		this.district = undefined;
		this.state = undefined;
		this.preferedContactTime = undefined;
		this.enabled = true;
		this.branch = new Branch();
		this.saldoFavor = 0;
		this.userName = undefined;
		this.observation = undefined;
		this.birthdayDate = undefined;
		this.ivaSituation = ivaSituationConsumidorFinal;
    this.status = '';
		this.ctaCteLimitAmount = 0;
		this.customerType = undefined;
	}
}

export class CustomerFilter {
	public name: string;
	public lastname: string;
	public dni: string;
	public checking_account_enable: boolean;
	public onlyenabled: boolean;
	public birth_month: string;
  public page: number;

	constructor() {
		this.name = '';
		this.lastname = '';
		this.dni = '';
		this.checking_account_enable = false;
		this.onlyenabled = true;
		this.birth_month = 'TODOS';
    this.page = 1;
	}
}
