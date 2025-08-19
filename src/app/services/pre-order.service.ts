import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { SqliteOrdersService } from './sqlite-orders.service';
import { BasketOrder } from '@models/basket-order';
import { BehaviorSubject, Observable } from 'rxjs';

export interface PreOrder extends BasketOrder {
  isPreOrder: true;
  tempId: string;
  createdAt: Date;
  needsSync: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PreOrderService {
  private preOrdersSubject = new BehaviorSubject<PreOrder[]>([]);

  constructor(
    private platform: Platform,
    private sqliteService: SqliteOrdersService
  ) {
    this.loadPreOrders();
  }

  async savePreOrder(preOrder: Partial<BasketOrder>): Promise<PreOrder> {
    const preOrderData: PreOrder = {
      ...preOrder,
      id: 0,
      isPreOrder: true,
      tempId: `pre_${Date.now()}`,
      createdAt: new Date(),
      needsSync: false
    } as PreOrder;

    // Guardar en IndexedDB/SQLite usando el servicio existente
    const savedOrder = await this.sqliteService.createOrder(preOrderData);
    
    // Actualizar observable
    await this.loadPreOrders();
    
    return savedOrder as PreOrder;
  }

  async getPreOrders(): Promise<PreOrder[]> {
    const allOrders = await this.sqliteService.getOrders();
    return allOrders.filter(order => (order as any).isPreOrder) as PreOrder[];
  }

  getPreOrdersObservable(): Observable<PreOrder[]> {
    return this.preOrdersSubject.asObservable();
  }

  private async loadPreOrders(): Promise<void> {
    const preOrders = await this.getPreOrders();
    this.preOrdersSubject.next(preOrders);
  }

  async getPreOrderById(id: number): Promise<PreOrder | null> {
    const order = await this.sqliteService.getOrderById(id);
    if (order && (order as any).isPreOrder) {
      return order as PreOrder;
    }
    return null;
  }

  async updatePreOrder(preOrder: PreOrder): Promise<PreOrder> {
    const updatedOrder = await this.sqliteService.updateOrder(preOrder);
    await this.loadPreOrders();
    return updatedOrder as PreOrder;
  }

  async deletePreOrder(id: number): Promise<void> {
    await this.sqliteService.deleteOrder(id);
    await this.loadPreOrders();
  }

  async markForSync(preOrderId: number): Promise<void> {
    const preOrder = await this.getPreOrderById(preOrderId);
    if (preOrder) {
      preOrder.needsSync = true;
      await this.updatePreOrder(preOrder);
    }
  }

  async getPendingSyncPreOrders(): Promise<PreOrder[]> {
    const preOrders = await this.getPreOrders();
    return preOrders.filter(order => order.needsSync);
  }

  // Export manual para respaldo
  async exportPreOrdersToJSON(): Promise<string> {
    const preOrders = await this.getPreOrders();
    return JSON.stringify(preOrders, null, 2);
  }

  // Import manual para restaurar
  async importPreOrdersFromJSON(jsonData: string): Promise<void> {
    try {
      const preOrders: PreOrder[] = JSON.parse(jsonData);
      
      for (const preOrder of preOrders) {
        try {
          // Verificar que no exista ya
          const existing = await this.sqliteService.getOrderById(preOrder.id!);
          if (!existing) {
            await this.sqliteService.createOrder(preOrder);
          }
        } catch (error) {
          console.warn(`Error importing pre-order ${preOrder.id}:`, error);
        }
      }
      
      await this.loadPreOrders();
    } catch (error) {
      throw new Error('Invalid JSON format');
    }
  }

  async clearAllPreOrders(): Promise<void> {
    const preOrders = await this.getPreOrders();
    for (const preOrder of preOrders) {
      await this.deletePreOrder(preOrder.id!);
    }
  }

  // Convertir pre-orden a orden real (remove isPreOrder flag)
  async convertToRegularOrder(preOrderId: number): Promise<BasketOrder> {
    const preOrder = await this.getPreOrderById(preOrderId);
    if (!preOrder) {
      throw new Error('Pre-order not found');
    }

    // Remover flags de pre-orden
    const regularOrder: BasketOrder = {
      ...preOrder,
      id: 0 // Reset ID para que se genere uno nuevo
    };
    
    // Eliminar propiedades específicas de pre-orden
    delete (regularOrder as any).isPreOrder;
    delete (regularOrder as any).tempId;
    delete (regularOrder as any).createdAt;
    delete (regularOrder as any).needsSync;

    // Crear como orden regular
    const savedOrder = await this.sqliteService.createOrder(regularOrder);
    
    // Eliminar pre-orden
    await this.deletePreOrder(preOrderId);
    
    return savedOrder;
  }
}