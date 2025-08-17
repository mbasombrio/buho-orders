
import { Department } from "./department";
import { Preference } from "./preference";

export class Article {
  sku: string; // codigo de barras
  name: string;
  unitPrice: number; // precio de Venta sin impuesto
  description?: string;
  priceCost?: number;
  unitInStock?: number;
  supplierId?: string;
  departmentId?: number;
  departamentName?: string;
  cantToOrder?: string |null;
  unitPrice2?: number;
  unitPrice3?: number;
  unitPrice4?: number;
  unitPrice5?: number;
  itemAvailable: boolean;
  profitMargin1?: number;
  profitMargin2?: number;
  profitMargin3?: number;
  profitMargin4?: number;
  profitMargin5?: number;
  itemIdCofarsurId?: number;
  usarPrecioSugerido: boolean;
  fractionated: boolean;
  quantityPerUnit: number;
  askPrice: boolean;
  formatQuantityExisting: string;
  model: string;
  department: Department;
  weight: boolean;
  taxCode1: number;
  sizes: string[]; // talles
  designs: string[]; // colores
  photosToRemove: string[];
  virtual: boolean;
  linkedItems: string[];
  linkedItemsCompleteList: Article[];
  dolarCost: number;
  priceCostFinal: number;
  discountpriceCost: number;
  marca: Preference;
  discountAvailable: boolean;

  constructor() {
    this.sku = "";
    this.name = "";
    this.description = "";
    this.priceCost = 0;
    this.unitInStock = 0;
    this.supplierId = "0";
    this.departmentId = 0;
    this.departamentName = "";
    this.cantToOrder = null;
    this.itemIdCofarsurId = 0;
    this.usarPrecioSugerido = false;
    this.itemAvailable = true;
    this.fractionated = false;
    this.quantityPerUnit = 0;
    this.askPrice = false;
    this.formatQuantityExisting = "";
    this.model = "";
    this.department = {
      id: 0,
      fatherId: 0,
      name: '',
      specialType: '',
      complexCode: '',
      text: ''
    };
    this.weight = false;
    this.taxCode1 = 2;
    this.sizes = [];
    this.designs = [];
    this.photosToRemove = [];
    this.virtual = false;
    this.linkedItems = [];
    this.linkedItemsCompleteList = [];
    this.dolarCost = 0;
    this.priceCostFinal = 0;
    this.discountpriceCost = 0;
    this.marca = new Preference(0, null, null, null, null);
    this.unitPrice = 0
    this.discountAvailable = true;
  }
}




