import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { OrdersManagerService } from '@services/orders-manager.service';
import { PreOrder } from '@services/pre-order.service';
import { BasketOrder } from '@models/basket-order';
import { Customer } from '@models/customer';
import { BasketItem } from '@models/carrito';

@Component({
  selector: 'app-test-sqlite',
  templateUrl: './test-sqlite.page.html',
  styleUrls: ['./test-sqlite.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class TestSqlitePage implements OnInit {
  orders: BasketOrder[] = [];
  preOrders: PreOrder[] = [];
  isLoading = false;
  stats: any = {};
  activeTab = 'orders'; // 'orders' | 'preorders'

  constructor(
    private ordersManager: OrdersManagerService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.loadOrders();
    this.loadPreOrders();
    this.loadStats();
  }

  async loadOrders() {
    this.isLoading = true;
    try {
      this.orders = await this.ordersManager.searchOrders(''); // Gets all orders
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async loadPreOrders() {
    this.isLoading = true;
    try {
      this.preOrders = await this.ordersManager.getPreOrders();
    } catch (error) {
      console.error('Error loading pre-orders:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async loadStats() {
    try {
      this.stats = await this.ordersManager.getOrderStatistics();
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  async createSamplePreOrder() {
    this.isLoading = true;
    try {
      const samplePreOrder = await this.ordersManager.createPreOrder({
        type: 'Normal',
        state: 'Draft', // Estado de pre-orden
        operator: 'test-operator',
        customer: {
          id: Date.now(),
          name: 'María',
          lastName: 'García',
          email: 'maria.garcia@test.com',
          cellphone: '987-654-3210',
          address: 'Avenida Pre-Orden 456',
          locality: 'PreOrder City',
          zipCode: '54321',
          contactPhone: '987-654-3210',
          contactEmail: 'maria.garcia@test.com',
          observation: 'Cliente de pre-orden',
          status: 'active',
          ctaCteLimitAmount: 0
        } as Customer,
        customerDelivery: {
          id: null,
          city: 'PreOrder City',
          name: 'María',
          lastName: 'García',
          address: 'Avenida Pre-Orden 456',
          cellphone: '987-654-3210',
          email: 'maria.garcia@test.com',
          zipCode: '54321',
          state: 'CABA'
        },
        items: [
          {
            id: 2,
            quantity: 1,
            unitPrice: 1500
          }
        ] as BasketItem[],
        totalAmount: 1500,
        observation: 'Pre-orden de prueba creada desde test'
      });
      
      await this.showToast('Pre-orden creada exitosamente');
      await this.loadPreOrders();
    } catch (error) {
      console.error('Error creating pre-order:', error);
      await this.showToast('Error al crear la pre-orden');
    } finally {
      this.isLoading = false;
    }
  }

  async createSampleOrder() {
    this.isLoading = true;
    try {
      const sampleOrder = await this.ordersManager.createOrder({
        type: 'Normal',
        state: 'Pending',
        operator: 'test-operator',
        customer: {
          id: Date.now(),
          name: 'Juan',
          lastName: 'Pérez',
          email: 'juan.perez@test.com',
          cellphone: '123-456-7890',
          address: 'Calle Ejemplo 123',
          locality: 'Test City',
          zipCode: '12345',
          contactPhone: '123-456-7890',
          contactEmail: 'juan.perez@test.com',
          observation: 'Cliente de prueba',
          status: 'active',
          ctaCteLimitAmount: 0
        } as Customer,
        customerDelivery: {
          id: null,
          city: 'Test City',
          name: 'Juan',
          lastName: 'Pérez',
          address: 'Calle Ejemplo 123',
          cellphone: '123-456-7890',
          email: 'juan.perez@test.com',
          zipCode: '12345',
          state: 'CABA'
        },
        items: [
          {
            id: 1,
            quantity: 2,
            unitPrice: 1000
          }
        ] as BasketItem[],
        totalAmount: 2000,
        observation: 'Orden de prueba creada desde test'
      });
      
      await this.showToast('Orden creada exitosamente');
      await this.loadOrders();
      await this.loadStats();
    } catch (error) {
      console.error('Error creating order:', error);
      await this.showToast('Error al crear la orden');
    } finally {
      this.isLoading = false;
    }
  }

  async loadSampleData() {
    this.isLoading = true;
    try {
      await this.ordersManager.loadSampleData();
      await this.showToast('Datos de muestra cargados');
      await this.loadOrders();
      await this.loadPreOrders();
      await this.loadStats();
    } catch (error) {
      console.error('Error loading sample data:', error);
      await this.showToast('Error al cargar datos de muestra');
    } finally {
      this.isLoading = false;
    }
  }

  async clearAllOrders() {
    const alert = await this.alertController.create({
      header: 'Confirmar',
      message: '¿Estás seguro de que quieres eliminar todas las órdenes?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          handler: async () => {
            this.isLoading = true;
            try {
              await this.ordersManager.clearAllOrders();
              await this.showToast('Todas las órdenes eliminadas');
              await this.loadOrders();
              await this.loadStats();
            } catch (error) {
              console.error('Error clearing orders:', error);
              await this.showToast('Error al eliminar órdenes');
            } finally {
              this.isLoading = false;
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async exportOrders() {
    try {
      const data = await this.ordersManager.exportOrdersToJSON();
      this.downloadFile(data, `orders-export-${new Date().getTime()}.json`);
      await this.showToast('Órdenes exportadas');
    } catch (error) {
      console.error('Error exporting orders:', error);
      await this.showToast('Error al exportar órdenes');
    }
  }

  async importOrders() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (event: any) => {
      const file = event.target.files[0];
      if (file) {
        try {
          const content = await file.text();
          await this.ordersManager.importOrdersFromJSON(content);
          await this.showToast('Órdenes importadas exitosamente');
          await this.loadOrders();
          await this.loadStats();
        } catch (error) {
          console.error('Error importing orders:', error);
          await this.showToast('Error al importar órdenes');
        }
      }
    };
    input.click();
  }

  async syncPreOrder(preOrder: PreOrder) {
    this.isLoading = true;
    try {
      const regularOrder = await this.ordersManager.syncPreOrderToRegularOrder(preOrder.id!);
      await this.showToast(`Pre-orden ${preOrder.tempId} sincronizada como orden regular`);
      await this.loadOrders();
      await this.loadPreOrders();
      await this.loadStats();
    } catch (error) {
      console.error('Error syncing pre-order:', error);
      await this.showToast('Error al sincronizar pre-orden');
    } finally {
      this.isLoading = false;
    }
  }

  async deletePreOrder(preOrder: PreOrder) {
    const alert = await this.alertController.create({
      header: 'Confirmar',
      message: `¿Eliminar pre-orden ${preOrder.tempId}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          handler: async () => {
            try {
              await this.ordersManager.deletePreOrder(preOrder.id!);
              await this.showToast('Pre-orden eliminada');
              await this.loadPreOrders();
            } catch (error) {
              console.error('Error deleting pre-order:', error);
              await this.showToast('Error al eliminar pre-orden');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async clearAllPreOrders() {
    const alert = await this.alertController.create({
      header: 'Confirmar',
      message: '¿Estás seguro de que quieres eliminar todas las pre-órdenes?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          handler: async () => {
            this.isLoading = true;
            try {
              await this.ordersManager.clearAllPreOrders();
              await this.showToast('Todas las pre-órdenes eliminadas');
              await this.loadPreOrders();
            } catch (error) {
              console.error('Error clearing pre-orders:', error);
              await this.showToast('Error al eliminar pre-órdenes');
            } finally {
              this.isLoading = false;
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async exportPreOrders() {
    try {
      const data = await this.ordersManager.exportPreOrdersToJSON();
      this.downloadFile(data, `preorders-export-${new Date().getTime()}.json`);
      await this.showToast('Pre-órdenes exportadas');
    } catch (error) {
      console.error('Error exporting pre-orders:', error);
      await this.showToast('Error al exportar pre-órdenes');
    }
  }

  async importPreOrders() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (event: any) => {
      const file = event.target.files[0];
      if (file) {
        try {
          const content = await file.text();
          await this.ordersManager.importPreOrdersFromJSON(content);
          await this.showToast('Pre-órdenes importadas exitosamente');
          await this.loadPreOrders();
        } catch (error) {
          console.error('Error importing pre-orders:', error);
          await this.showToast('Error al importar pre-órdenes');
        }
      }
    };
    input.click();
  }

  switchTab(tab: string) {
    this.activeTab = tab;
  }

  onTabChange(event: any) {
    this.switchTab(String(event.detail.value));
  }

  trackByOrderId(index: number, order: BasketOrder): any {
    return order.id;
  }

  trackByPreOrderId(index: number, preOrder: PreOrder): any {
    return preOrder.id;
  }

  private downloadFile(data: string, filename: string) {
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }
}