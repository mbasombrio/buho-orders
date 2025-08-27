
import { Department } from "./department";
import { Preference } from "./preference";
import { Supplier } from "./supplier";

export interface Article {
     sku: string;
     name: string;
     description: string;
     unitPrice1: number;
     unitPrice2: number;
     unitPrice3: number;
     unitPrice4: number;
     unitPrice5: number;
     sizes: string[];
     designs: string[];
     unitInStock: number;
     department: Department;
     supplier: Supplier;
     brand: Preference;
     taxCode1: number;
}




