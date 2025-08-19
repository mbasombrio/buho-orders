import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { AlertController, IonicModule, ModalController } from '@ionic/angular';
import { SqliteOrdersService } from '@services/sqlite-orders.service';
import { BasketOrder } from '@models/basket-order';
import { Branch } from '@models/branch';
import { User } from '@models/user';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.page.html',
  styleUrls: ['./orders.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule
  ]
})
export class OrdersPage implements OnInit, OnDestroy {
  orders: BasketOrder[] = [];
  orderResponse = {
    rows: this.orders,
    pagination: {
      count: 0,
      page: 1,
      pages: 1,
      size: 25
    }
  };
  
  private ordersSubscription?: Subscription;

  constructor(
    private alertController: AlertController,
    private modalController: ModalController,
    private sqliteOrdersService: SqliteOrdersService
  ) { }

  ngOnInit() {
    this.initializeOrders();
  }

  ngOnDestroy() {
    if (this.ordersSubscription) {
      this.ordersSubscription.unsubscribe();
    }
  }

  private async initializeOrders() {
    try {
      // Suscribirse primero a los cambios
      this.ordersSubscription = this.sqliteOrdersService.getOrdersObservable().subscribe(orders => {
        this.orders = orders;
        this.orderResponse.rows = orders;
        this.orderResponse.pagination.count = orders.length;
        this.orderResponse.pagination.pages = Math.ceil(orders.length / this.orderResponse.pagination.size);
      });

      // Luego verificar si necesitamos datos de ejemplo
      const ordersCount = await this.sqliteOrdersService.getOrdersCount();
      if (ordersCount === 0) {
        console.log('Loading sample data...');
        await this.sqliteOrdersService.loadSampleData();
      }
    } catch (error) {
      console.error('Error initializing orders:', error);
      await this.showToast('Error al cargar las órdenes');
    }
  }

  BasketOrderState = {
    Open: 'Abierto',
    Closed: 'Cerrado',
    Pending: 'Pendiente',
    Delivered: 'Entregado',
    Canceled: 'Cancelado',
    Invoiced: 'Facturado',
    cancelled: 'Cancelado',
    Approved: 'Aprobado',
  };

  toShowMoney = (value: number) => (value ? value / 100.0 : 0);

  showTotal(element:any) {
    let total = Number(this.toShowMoney(element.totalAmount));
    if (element.deliveryAmount) {
      total += Number(element.deliveryAmount);
    }
    return total;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Invoiced':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'en-proceso':
        return 'primary';
      case 'cancelled':
        return 'danger';
      default:
        return 'medium';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'completado':
        return 'Completado';
      case 'pendiente':
        return 'Pendiente';
      case 'en-proceso':
        return 'En Proceso';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  }

  getDeliveryType(order: any): string {
    // Si hay información de entrega a domicilio y tiene dirección, es envío
    if (order.customerDelivery && order.customerDelivery.address && order.customerDelivery.address.trim() !== '') {
      return 'Envío';
    }
    // Si el cliente tiene dirección pero no hay customerDelivery específico
    if (order.customer && order.customer.address && order.customer.address.trim() !== '') {
      return 'Envío';
    }
    // Si hay monto de delivery mayor a 0, probablemente es envío
    if (order.deliveryAmount && order.deliveryAmount > 0) {
      return 'Envío';
    }
    // Por defecto es retiro
    return 'Retiro';
  }

  getDeliveryTypeColor(order: any): string {
    const deliveryType = this.getDeliveryType(order);
    return deliveryType === 'Envío' ? 'tertiary' : 'secondary';
  }

  getBranchName(order: any): string {
    if (order.branch && order.branch.businessName) {
      return order.branch.businessName;
    }
    return 'Sucursal Principal';
  }

  viewOrderDetails(order: any) {
    console.log('Ver detalles de la orden:', order);
    // Aquí puedes implementar la navegación a los detalles de la orden
  }

  async editOrder(order: any) {
    const alert = await this.alertController.create({
      header: `Editar Pedido #${order.id}`,
      subHeader: `Cliente: ${order.customer.name} ${order.customer.lastName}`,
      message: 'Seleccione la acción que desea realizar:',
      buttons: [
        {
          text: 'Cambiar Estado',
          handler: () => {
            this.changeOrderStatus(order);
          }
        },
        {
          text: 'Editar Cliente',
          handler: () => {
            this.editCustomer(order);
          }
        },
        {
          text: 'Editar Detalles',
          handler: () => {
            this.editOrderDetails(order);
          }
        },
        {
          text: 'Cancelar',
          role: 'cancel'
        }
      ]
    });

    await alert.present();
  }

  async deleteOrder(order: any) {
    const alert = await this.alertController.create({
      header: 'Confirmar Eliminación',
      message: `¿Está seguro de que desea eliminar el pedido #${order.id}?<br><br>Cliente: ${order.customer.name} ${order.customer.lastName}<br>Total: $${this.showTotal(order)}`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.sqliteOrdersService.deleteOrder(order.id);
              this.showToast(`Pedido #${order.id} eliminado exitosamente`);
            } catch (error) {
              console.error('Error deleting order:', error);
              this.showToast('Error al eliminar el pedido');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async changeOrderStatus(order: any) {
    const alert = await this.alertController.create({
      header: 'Cambiar Estado del Pedido',
      message: `Estado actual: ${this.getStatusText(order.state)}`,
      inputs: [
        {
          name: 'status',
          type: 'radio',
          label: 'Pendiente',
          value: 'Pending',
          checked: order.state === 'Pending'
        },
        {
          name: 'status',
          type: 'radio',
          label: 'En Proceso',
          value: 'en-proceso',
          checked: order.state === 'en-proceso'
        },
        {
          name: 'status',
          type: 'radio',
          label: 'Facturado',
          value: 'Invoiced',
          checked: order.state === 'Invoiced'
        },
        {
          name: 'status',
          type: 'radio',
          label: 'Cancelado',
          value: 'cancelled',
          checked: order.state === 'cancelled'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Guardar',
          handler: async (data) => {
            if (data && data !== order.state) {
              try {
                order.state = data;
                await this.sqliteOrdersService.updateOrder(order);
                this.showToast(`Estado del pedido #${order.id} actualizado a ${this.getStatusText(data)}`);
              } catch (error) {
                console.error('Error updating order status:', error);
                this.showToast('Error al actualizar el estado del pedido');
              }
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async editCustomer(order: any) {
    const alert = await this.alertController.create({
      header: 'Editar Información del Cliente',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Nombre',
          value: order.customer.name
        },
        {
          name: 'lastName',
          type: 'text',
          placeholder: 'Apellido',
          value: order.customer.lastName
        },
        {
          name: 'email',
          type: 'email',
          placeholder: 'Email',
          value: order.customer.email
        },
        {
          name: 'cellphone',
          type: 'tel',
          placeholder: 'Teléfono',
          value: order.customer.cellphone
        },
        {
          name: 'address',
          type: 'text',
          placeholder: 'Dirección',
          value: order.customer.address
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Guardar',
          handler: async (data) => {
            try {
              if (data.name) order.customer.name = data.name;
              if (data.lastName) order.customer.lastName = data.lastName;
              if (data.email) order.customer.email = data.email;
              if (data.cellphone) order.customer.cellphone = data.cellphone;
              if (data.address) order.customer.address = data.address;

              await this.sqliteOrdersService.updateOrder(order);
              this.showToast(`Información del cliente actualizada para el pedido #${order.id}`);
            } catch (error) {
              console.error('Error updating customer info:', error);
              this.showToast('Error al actualizar la información del cliente');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async editOrderDetails(order: any) {
    const totalInCents = order.totalAmount;
    const totalInPesos = this.toShowMoney(totalInCents);

    const alert = await this.alertController.create({
      header: 'Editar Detalles del Pedido',
      inputs: [
        {
          name: 'type',
          type: 'text',
          placeholder: 'Tipo de pedido',
          value: order.type
        },
        {
          name: 'totalAmount',
          type: 'number',
          placeholder: 'Monto total',
          value: totalInPesos
        },
        {
          name: 'deliveryAmount',
          type: 'number',
          placeholder: 'Costo de envío',
          value: order.deliveryAmount
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Guardar',
          handler: async (data) => {
            try {
              if (data.type) order.type = data.type;
              if (data.totalAmount) order.totalAmount = parseFloat(data.totalAmount) * 100;
              if (data.deliveryAmount) order.deliveryAmount = parseFloat(data.deliveryAmount);

              await this.sqliteOrdersService.updateOrder(order);
              this.showToast(`Detalles del pedido #${order.id} actualizados`);
            } catch (error) {
              console.error('Error updating order details:', error);
              this.showToast('Error al actualizar los detalles del pedido');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async showToast(message: string) {
    // Simple console log for now, you can implement a toast service later
    console.log(message);

    // You could also show an alert as a simple notification
    const alert = await this.alertController.create({
      message: message,
      buttons: ['OK']
    });

    await alert.present();

    // Auto dismiss after 2 seconds
    setTimeout(() => {
      alert.dismiss();
    }, 2000);
  }

  async addNewOrder() {
    const alert = await this.alertController.create({
      header: 'Crear Nuevo Pedido',
      message: 'Ingrese los datos básicos del pedido:',
      inputs: [
        {
          name: 'customerName',
          type: 'text',
          placeholder: 'Nombre del cliente',
          attributes: {
            required: true
          }
        },
        {
          name: 'customerLastName',
          type: 'text',
          placeholder: 'Apellido del cliente',
          attributes: {
            required: true
          }
        },
        {
          name: 'customerEmail',
          type: 'email',
          placeholder: 'Email del cliente'
        },
        {
          name: 'customerPhone',
          type: 'tel',
          placeholder: 'Teléfono del cliente'
        },
        {
          name: 'totalAmount',
          type: 'number',
          placeholder: 'Monto total',
          attributes: {
            min: 0,
            step: 0.01
          }
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Crear Pedido',
          handler: (data) => {
            if (data.customerName && data.customerLastName) {
              this.createNewOrder(data);
              return true;
            } else {
              this.showToast('Por favor complete al menos el nombre y apellido del cliente');
              return false;
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async createNewOrder(data: any) {
    try {
      const existingOrders = await this.sqliteOrdersService.getOrders();
      const newId = existingOrders.length > 0 ? Math.max(...existingOrders.map(o => o.id || 0)) + 1 : 1;

      const newOrder: BasketOrder = {
        deliveryAmount: 0,
        user: {
          id: 1,
          userName: "system",
          password: "",
          passVerify: "",
          name: "system",
          email: "",
          cellphone: "",
          role: 1,
          roleDescription: "",
          enabled: true,
          branches: [],
          client: null,
          restrictions: null
        },
        id: newId,
        index: existingOrders.length,
        type: "Normal",
        open: new Date(),
        state: "Pending",
        operator: "system",
        customer: {
          customerType: "MINORISTA",
          id: Date.now(),
          dni: "0",
          city: "",
          name: data.customerName,
          lastName: data.customerLastName,
          email: data.customerEmail || "",
          cellphone: data.customerPhone || "",
          address: "",
          zipCode: "",
          checkingAccountEnabled: false,
          password: "",
          branch: new Branch(),
          enabled: true,
          district: "",
          state: "",
          saldoFavor: 0.0,
          listPrice: 3,
          ivaSituation: "CONSUMIDOR_FINAL",
          ctaCteLimitAmount: 0,
          status: ""
        },
        customerDelivery: {
          id: Date.now() + 1,
          city: "",
          name: data.customerName,
          lastName: data.customerLastName,
          email: data.customerEmail || "",
          cellphone: data.customerPhone || "",
          address: "",
          zipCode: "",
          state: ""
        },
        items: [],
        totalAmount: data.totalAmount ? parseFloat(data.totalAmount) * 100 : 0,
        branch: {
          id: 1,
          businessName: "Default",
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
        send: "",
        payment: "",
        paymentStatus: "",
        observation: ""
      };

      await this.sqliteOrdersService.createOrder(newOrder);
      this.showToast(`Nuevo pedido #${newId} creado exitosamente`);
    } catch (error) {
      console.error('Error creating new order:', error);
      this.showToast('Error al crear el nuevo pedido');
    }
  }
}
