
import { Article } from "@models/article";
import { Branch } from "@models/branch";
import { Customer } from "@models/customer";
import { User } from "@models/user";


export class Carrito {
    id: number | null;
    listadoArticulos: BasketItem[];
    customer: Customer;
    customerDelivery: BasketCustomer;
    branch: Branch;
    send: string | null;
    tender: string | null;
    deliveryAmount: number | null;
    user: User | null;
    observation: string | null;
    state: string | null;

    constructor() {
        this.id = null;
        this.listadoArticulos = [];
        this.customer = new Customer();
        this.customerDelivery = new BasketCustomer()
        this.branch = new Branch();
        this.send = null;
        this.tender = null;
        this.deliveryAmount = null;
        this.user = null;
        this.observation = null;
        this.state = "Pending"
    }
}

export class BasketCustomer {
    id: number | null;
    city: string | null;
    name: string | null;
    lastName: string | null;
    email: string | null;
    cellphone: string | null;
    address: string | null;
    zipCode: string | null;
    state: string | null;

    constructor() {
        this.id = null;
        this.city = null;
        this.name = null;
        this.lastName = null;
        this.email = null;
        this.cellphone = null;
        this.address = null;
        this.zipCode = null;
        this.state = null;
    }
}

export class BasketItem {
    id: number | null;
    item: Article | null;
    status: string | null;
    date: Date | null;
    quantity: number | null;
    weight: number | null;
    unitPrice: number | null;
    size: string | null;
    design: string | null;

    constructor() {
        this.id = null;
        this.item = null;
        this.status = null;
        this.date = null;
        this.quantity = null;
        this.weight = null;
        this.unitPrice = null;
        this.size = null;
        this.design = null;
    }
}

export const BasketItemStatus = {
  Pending: 'Pendiente',
  InPreparation: 'En preparacion',
  Delivered: 'Entregado',
  Canceled: 'Cancelado',
}
