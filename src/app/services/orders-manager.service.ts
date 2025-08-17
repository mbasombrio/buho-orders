import { Injectable } from '@angular/core';
import { SqliteOrdersService } from './sqlite-orders.service';
import { BasketOrder, BasketListFilter } from '@models/basket-order';
import { Branch } from '@models/branch';
import { User } from '@models/user';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OrdersManagerService {

  constructor(private sqliteOrdersService: SqliteOrdersService) { }

  async createOrder(order: Partial<BasketOrder>): Promise<BasketOrder> {
    const newOrder: BasketOrder = {
      id: 0,
      index: 0,
      type: order.type || 'Normal',
      open: new Date(),
      state: order.state || 'Pending',
      operator: order.operator || 'system',
      customer: order.customer!,
      customerDelivery: order.customerDelivery!,
      items: order.items || [],
      totalAmount: order.totalAmount || 0,
      branch: order.branch || { 
        id: 1, 
        businessName: 'Default',
        address: "",
        locality: "",
        contact: "",
        contactPhone: "",
        contactEmail: "",
        alternativeContactEmail: "",
        afipCondition: "",
        responsible: "",
        cuit: "",
        deposits: []
      },
      send: order.send || '',
      payment: order.payment || '',
      paymentStatus: order.paymentStatus || '',
      deliveryAmount: order.deliveryAmount || 0,
      user: order.user || { 
        id: 1, 
        userName: 'system',
        password: '',
        passVerify: '',
        name: 'system',
        email: '',
        cellphone: '',
        role: 1,
        roleDescription: '',
        enabled: true,
        branches: [],
        client: null,
        restrictions: null
      },
      observation: order.observation || ''
    };

    return await this.sqliteOrdersService.createOrder(newOrder);
  }

  async getOrderById(id: number): Promise<BasketOrder | null> {
    return await this.sqliteOrdersService.getOrderById(id);
  }

  async updateOrder(order: BasketOrder): Promise<BasketOrder> {
    return await this.sqliteOrdersService.updateOrder(order);
  }

  async deleteOrder(id: number): Promise<void> {
    return await this.sqliteOrdersService.deleteOrder(id);
  }

  async getFilteredOrders(filter: BasketListFilter): Promise<{ rows: BasketOrder[], pages: number }> {
    let orders = await this.sqliteOrdersService.getOrders();

    if (filter.state && filter.state !== '') {
      orders = orders.filter(order => order.state === filter.state);
    }

    if (filter.customerName) {
      const searchTerm = filter.customerName.toLowerCase();
      orders = orders.filter(order => 
        order.customer.name.toLowerCase().includes(searchTerm) ||
        order.customer.lastName.toLowerCase().includes(searchTerm)
      );
    }

    if (filter.basketId) {
      orders = orders.filter(order => order.id === filter.basketId);
    }

    if (filter.userId) {
      orders = orders.filter(order => order.user.id === filter.userId);
    }

    if (filter.branch && filter.branch !== 9999999) {
      orders = orders.filter(order => order.branch.id === filter.branch);
    }

    if (filter.dateFrom && filter.dateTo) {
      const dateFrom = new Date(filter.dateFrom);
      const dateTo = new Date(filter.dateTo);
      dateTo.setHours(23, 59, 59, 999);

      orders = orders.filter(order => {
        const orderDate = new Date(order.open);
        return orderDate >= dateFrom && orderDate <= dateTo;
      });
    }

    const pageSize = 25;
    const totalPages = Math.ceil(orders.length / pageSize);
    const startIndex = (filter.page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedOrders = orders.slice(startIndex, endIndex);

    return {
      rows: paginatedOrders,
      pages: totalPages
    };
  }

  getOrdersObservable(): Observable<BasketOrder[]> {
    return this.sqliteOrdersService.getOrdersObservable();
  }

  getFilteredOrdersObservable(filter: BasketListFilter): Observable<{ rows: BasketOrder[], pages: number }> {
    return this.sqliteOrdersService.getOrdersObservable().pipe(
      map(orders => {
        let filteredOrders = orders;

        if (filter.state && filter.state !== '') {
          filteredOrders = filteredOrders.filter(order => order.state === filter.state);
        }

        if (filter.customerName) {
          const searchTerm = filter.customerName.toLowerCase();
          filteredOrders = filteredOrders.filter(order => 
            order.customer.name.toLowerCase().includes(searchTerm) ||
            order.customer.lastName.toLowerCase().includes(searchTerm)
          );
        }

        if (filter.basketId) {
          filteredOrders = filteredOrders.filter(order => order.id === filter.basketId);
        }

        if (filter.userId) {
          filteredOrders = filteredOrders.filter(order => order.user.id === filter.userId);
        }

        if (filter.branch && filter.branch !== 9999999) {
          filteredOrders = filteredOrders.filter(order => order.branch.id === filter.branch);
        }

        if (filter.dateFrom && filter.dateTo) {
          const dateFrom = new Date(filter.dateFrom);
          const dateTo = new Date(filter.dateTo);
          dateTo.setHours(23, 59, 59, 999);

          filteredOrders = filteredOrders.filter(order => {
            const orderDate = new Date(order.open);
            return orderDate >= dateFrom && orderDate <= dateTo;
          });
        }

        const pageSize = 25;
        const totalPages = Math.ceil(filteredOrders.length / pageSize);
        const startIndex = (filter.page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

        return {
          rows: paginatedOrders,
          pages: totalPages
        };
      })
    );
  }

  async searchOrders(searchTerm: string): Promise<BasketOrder[]> {
    const allOrders = await this.sqliteOrdersService.getOrders();
    const term = searchTerm.toLowerCase();

    return allOrders.filter(order => 
      order.id.toString().includes(term) ||
      order.customer.name.toLowerCase().includes(term) ||
      order.customer.lastName.toLowerCase().includes(term) ||
      order.customer.email.toLowerCase().includes(term) ||
      order.customer.cellphone.includes(term) ||
      order.state.toLowerCase().includes(term) ||
      order.branch.businessName.toLowerCase().includes(term)
    );
  }

  async getOrdersByDateRange(startDate: Date, endDate: Date): Promise<BasketOrder[]> {
    const allOrders = await this.sqliteOrdersService.getOrders();
    
    return allOrders.filter(order => {
      const orderDate = new Date(order.open);
      return orderDate >= startDate && orderDate <= endDate;
    });
  }

  async getOrderStatistics(): Promise<{
    total: number;
    pending: number;
    invoiced: number;
    cancelled: number;
    totalAmount: number;
  }> {
    const orders = await this.sqliteOrdersService.getOrders();
    
    const stats = {
      total: orders.length,
      pending: 0,
      invoiced: 0,
      cancelled: 0,
      totalAmount: 0
    };

    orders.forEach(order => {
      switch (order.state) {
        case 'Pending':
          stats.pending++;
          break;
        case 'Invoiced':
          stats.invoiced++;
          break;
        case 'cancelled':
          stats.cancelled++;
          break;
      }
      stats.totalAmount += order.totalAmount / 100; // Convert from cents
    });

    return stats;
  }

  async exportOrdersToJSON(): Promise<string> {
    const orders = await this.sqliteOrdersService.getOrders();
    return JSON.stringify(orders, null, 2);
  }

  async importOrdersFromJSON(jsonData: string): Promise<void> {
    try {
      const orders: BasketOrder[] = JSON.parse(jsonData);
      
      for (const order of orders) {
        try {
          await this.sqliteOrdersService.createOrder(order);
        } catch (error) {
          console.warn(`Error importing order ${order.id}:`, error);
        }
      }
    } catch (error) {
      throw new Error('Invalid JSON format');
    }
  }

  async clearAllOrders(): Promise<void> {
    return await this.sqliteOrdersService.clearAllOrders();
  }

  async loadSampleData(): Promise<void> {
    return await this.sqliteOrdersService.loadSampleData();
  }
}