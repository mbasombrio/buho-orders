import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { BasketOrder } from '@models/basket-order';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NativeSqliteService {
  private sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);
  private db: SQLiteDBConnection | null = null;
  private dbName = 'buho_orders.db';
  private ordersSubject = new BehaviorSubject<BasketOrder[]>([]);
  private isDbReady = false;

  constructor() {
    this.initializeDB();
  }

  private async initializeDB(): Promise<void> {
    try {
      if (!Capacitor.isNativePlatform()) {
        console.warn('SQLite plugin only works on native platforms');
        return;
      }

      const ret = await this.sqlite.checkConnectionsConsistency();
      const isConn = (await this.sqlite.isConnection(this.dbName, false)).result;

      if (ret.result && isConn) {
        this.db = await this.sqlite.retrieveConnection(this.dbName, false);
      } else {
        this.db = await this.sqlite.createConnection(
          this.dbName,
          false,
          'no-encryption',
          1,
          false
        );
      }

      await this.db.open();
      await this.createTables();
      this.isDbReady = true;
      await this.loadOrders();
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) return;

    const createOrdersTable = `
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        delivery_amount REAL,
        user_id INTEGER,
        user_name TEXT,
        index_order INTEGER,
        type TEXT,
        open_date TEXT,
        state TEXT,
        operator TEXT,
        customer_id INTEGER,
        customer_name TEXT,
        customer_last_name TEXT,
        customer_email TEXT,
        customer_phone TEXT,
        customer_address TEXT,
        customer_city TEXT,
        customer_zip_code TEXT,
        customer_dni TEXT,
        customer_type TEXT,
        delivery_id INTEGER,
        delivery_name TEXT,
        delivery_last_name TEXT,
        delivery_email TEXT,
        delivery_phone TEXT,
        delivery_address TEXT,
        delivery_city TEXT,
        delivery_zip_code TEXT,
        total_amount REAL,
        branch_id INTEGER,
        branch_name TEXT,
        send TEXT,
        payment TEXT,
        payment_status TEXT,
        observation TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createOrderItemsTable = `
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        article_id INTEGER,
        article_code TEXT,
        article_name TEXT,
        article_description TEXT,
        quantity REAL,
        price REAL,
        subtotal REAL,
        FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
      );
    `;

    try {
      await this.db.execute(createOrdersTable);
      await this.db.execute(createOrderItemsTable);
      console.log('Tables created successfully');
    } catch (error) {
      console.error('Error creating tables:', error);
    }
  }

  async createOrder(order: BasketOrder): Promise<BasketOrder> {
    if (!this.isDbReady || !this.db) {
      throw new Error('Database not ready');
    }

    const insertOrderSQL = `
      INSERT INTO orders (
        delivery_amount, user_id, user_name, index_order, type, open_date,
        state, operator, customer_id, customer_name, customer_last_name,
        customer_email, customer_phone, customer_address, customer_city,
        customer_zip_code, customer_dni, customer_type, delivery_id,
        delivery_name, delivery_last_name, delivery_email, delivery_phone,
        delivery_address, delivery_city, delivery_zip_code, total_amount,
        branch_id, branch_name, send, payment, payment_status, observation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      order.deliveryAmount,
      order.user?.id,
      order.user?.name,
      order.index,
      order.type,
      order.open ? order.open.toISOString() : new Date().toISOString(),
      order.state,
      order.operator,
      order.customer?.id,
      order.customer?.name,
      order.customer?.lastName,
      order.customer?.email,
      order.customer?.cellphone,
      order.customer?.address,
      order.customer?.city,
      order.customer?.zipCode,
      order.customer?.dni,
      order.customer?.customerType,
      order.customerDelivery?.id,
      order.customerDelivery?.name,
      order.customerDelivery?.lastName,
      order.customerDelivery?.email,
      order.customerDelivery?.cellphone,
      order.customerDelivery?.address,
      order.customerDelivery?.city,
      order.customerDelivery?.zipCode,
      order.totalAmount,
      order.branch?.id,
      order.branch?.businessName,
      order.send,
      order.payment,
      order.paymentStatus,
      order.observation
    ];

    try {
      const result = await this.db.run(insertOrderSQL, values);
      const newOrderId = result.changes?.lastId;
      
      if (newOrderId && order.items && order.items.length > 0) {
        await this.insertOrderItems(newOrderId, order.items);
      }

      await this.loadOrders();
      return { ...order, id: newOrderId || undefined };
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  private async insertOrderItems(orderId: number, items: any[]): Promise<void> {
    if (!this.db) return;

    const insertItemSQL = `
      INSERT INTO order_items (
        order_id, article_id, article_code, article_name,
        article_description, quantity, price, subtotal
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    for (const item of items) {
      const values = [
        orderId,
        item.item?.id,
        item.item?.code,
        item.item?.name,
        item.item?.description,
        item.quantity,
        item.unitPrice,
        (item.quantity || 0) * (item.unitPrice || 0)
      ];

      await this.db.run(insertItemSQL, values);
    }
  }

  async getOrders(): Promise<BasketOrder[]> {
    if (!this.isDbReady || !this.db) {
      return [];
    }

    const query = `
      SELECT * FROM orders 
      ORDER BY created_at DESC
    `;

    try {
      const result = await this.db.query(query);
      const orders: BasketOrder[] = [];

      if (result.values) {
        for (const row of result.values) {
          const order = await this.mapRowToOrder(row);
          orders.push(order);
        }
      }

      return orders;
    } catch (error) {
      console.error('Error getting orders:', error);
      return [];
    }
  }

  private async mapRowToOrder(row: any): Promise<BasketOrder> {
    const items = await this.getOrderItems(row.id);

    return {
      id: row.id,
      deliveryAmount: row.delivery_amount,
      user: {
        id: row.user_id,
        userName: row.user_name,
        name: row.user_name,
        password: '',
        passVerify: '',
        email: '',
        cellphone: '',
        role: 1,
        roleDescription: '',
        enabled: true,
        branches: [],
        client: null,
        restrictions: null
      },
      index: row.index_order,
      type: row.type,
      open: row.open_date ? new Date(row.open_date) : new Date(),
      state: row.state,
      operator: row.operator,
      customer: {
        id: row.customer_id,
        name: row.customer_name,
        lastName: row.customer_last_name,
        email: row.customer_email,
        cellphone: row.customer_phone,
        address: row.customer_address,
        city: row.customer_city,
        zipCode: row.customer_zip_code,
        dni: row.customer_dni,
        customerType: row.customer_type,
        checkingAccountEnabled: false,
        password: '',
        branch: {
          id: 0,
          businessName: '',
          address: '',
          locality: '',
          contact: '',
          contactPhone: '',
          contactEmail: '',
          alternativeContactEmail: '',
          afipCondition: '',
          responsible: '',
          cuit: '',
          deposits: []
        },
        enabled: true,
        district: '',
        state: '',
        saldoFavor: 0,
        listPrice: 0,
        ivaSituation: '',
        ctaCteLimitAmount: 0,
        status: ''
      },
      customerDelivery: {
        id: row.delivery_id,
        name: row.delivery_name,
        lastName: row.delivery_last_name,
        email: row.delivery_email,
        cellphone: row.delivery_phone,
        address: row.delivery_address,
        city: row.delivery_city,
        zipCode: row.delivery_zip_code,
        state: ''
      },
      items: items,
      totalAmount: row.total_amount,
      branch: {
        id: row.branch_id,
        businessName: row.branch_name,
        address: '',
        locality: '',
        contact: '',
        contactPhone: '',
        contactEmail: '',
        alternativeContactEmail: '',
        afipCondition: '',
        responsible: '',
        cuit: '',
        deposits: []
      },
      send: row.send,
      payment: row.payment,
      paymentStatus: row.payment_status,
      observation: row.observation
    };
  }

  private async getOrderItems(orderId: number): Promise<any[]> {
    if (!this.db) return [];

    const query = `
      SELECT * FROM order_items 
      WHERE order_id = ?
    `;

    try {
      const result = await this.db.query(query, [orderId]);
      const items: any[] = [];

      if (result.values) {
        for (const row of result.values) {
          items.push({
            id: row.id,
            item: null,
            status: "Pending",
            date: new Date(),
            quantity: row.quantity,
            weight: false,
            unitPrice: row.price,
            size: null,
            design: null
          });
        }
      }

      return items;
    } catch (error) {
      console.error('Error getting order items:', error);
      return [];
    }
  }

  getOrdersObservable(): Observable<BasketOrder[]> {
    return this.ordersSubject.asObservable();
  }

  async getOrderById(id: number): Promise<BasketOrder | null> {
    if (!this.isDbReady || !this.db) {
      return null;
    }

    const query = `
      SELECT * FROM orders 
      WHERE id = ?
    `;

    try {
      const result = await this.db.query(query, [id]);
      
      if (result.values && result.values.length > 0) {
        return await this.mapRowToOrder(result.values[0]);
      }

      return null;
    } catch (error) {
      console.error('Error getting order by id:', error);
      return null;
    }
  }

  async updateOrder(order: BasketOrder): Promise<BasketOrder> {
    if (!this.isDbReady || !this.db || !order.id) {
      throw new Error('Database not ready or order ID missing');
    }

    const updateSQL = `
      UPDATE orders SET
        delivery_amount = ?, state = ?, total_amount = ?,
        payment = ?, payment_status = ?, observation = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const values = [
      order.deliveryAmount,
      order.state,
      order.totalAmount,
      order.payment,
      order.paymentStatus,
      order.observation,
      order.id
    ];

    try {
      await this.db.run(updateSQL, values);
      await this.loadOrders();
      return order;
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  }

  async deleteOrder(id: number): Promise<void> {
    if (!this.isDbReady || !this.db) {
      throw new Error('Database not ready');
    }

    try {
      await this.db.run('DELETE FROM order_items WHERE order_id = ?', [id]);
      await this.db.run('DELETE FROM orders WHERE id = ?', [id]);
      await this.loadOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  }

  async getOrdersByState(state: string): Promise<BasketOrder[]> {
    if (!this.isDbReady || !this.db) {
      return [];
    }

    const query = `
      SELECT * FROM orders 
      WHERE state = ?
      ORDER BY created_at DESC
    `;

    try {
      const result = await this.db.query(query, [state]);
      const orders: BasketOrder[] = [];

      if (result.values) {
        for (const row of result.values) {
          const order = await this.mapRowToOrder(row);
          orders.push(order);
        }
      }

      return orders;
    } catch (error) {
      console.error('Error getting orders by state:', error);
      return [];
    }
  }

  async searchOrdersByCustomerName(name: string): Promise<BasketOrder[]> {
    if (!this.isDbReady || !this.db) {
      return [];
    }

    const query = `
      SELECT * FROM orders 
      WHERE customer_name LIKE ? OR customer_last_name LIKE ?
      ORDER BY created_at DESC
    `;

    const searchTerm = `%${name}%`;

    try {
      const result = await this.db.query(query, [searchTerm, searchTerm]);
      const orders: BasketOrder[] = [];

      if (result.values) {
        for (const row of result.values) {
          const order = await this.mapRowToOrder(row);
          orders.push(order);
        }
      }

      return orders;
    } catch (error) {
      console.error('Error searching orders:', error);
      return [];
    }
  }

  async clearAllOrders(): Promise<void> {
    if (!this.isDbReady || !this.db) {
      throw new Error('Database not ready');
    }

    try {
      await this.db.run('DELETE FROM order_items');
      await this.db.run('DELETE FROM orders');
      await this.loadOrders();
    } catch (error) {
      console.error('Error clearing orders:', error);
      throw error;
    }
  }

  async getOrdersCount(): Promise<number> {
    if (!this.isDbReady || !this.db) {
      return 0;
    }

    const query = 'SELECT COUNT(*) as count FROM orders';

    try {
      const result = await this.db.query(query);
      return result.values?.[0]?.count || 0;
    } catch (error) {
      console.error('Error getting orders count:', error);
      return 0;
    }
  }

  private async loadOrders(): Promise<void> {
    try {
      const orders = await this.getOrders();
      this.ordersSubject.next(orders);
    } catch (error) {
      console.error('Error loading orders:', error);
      this.ordersSubject.next([]);
    }
  }

  async closeConnection(): Promise<void> {
    if (this.db) {
      await this.sqlite.closeConnection(this.dbName, false);
      this.db = null;
      this.isDbReady = false;
    }
  }
}