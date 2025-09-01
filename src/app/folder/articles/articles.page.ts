import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertController, IonicModule, ToastController } from '@ionic/angular';
import { Article } from '@models/article';
import { ItemsService } from '@services/items.service';
import { SqliteArticlesService } from '@services/sqlite-articles.service';
import { ClientsService } from '@services/clients.service';
import { SqliteClientsService } from '@services/sqlite-clients.service';
import { Customer } from '@models/customer';

@Component({
  selector: 'app-articles',
  templateUrl: './articles.page.html',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    FormsModule
  ]
})
export class ArticlesPage {

  isLoading = signal<boolean>(false);
  loadingMessage = signal<string>('Importando artículos...');
  itemsService = inject(ItemsService);
  sqliteArticlesService = inject(SqliteArticlesService);
  clientsService = inject(ClientsService);
  sqliteClientsService = inject(SqliteClientsService);
  toastController = inject(ToastController);
  alertController = inject(AlertController);

  constructor() {}

  async importClients() {
    this.isLoading.set(true);
    this.loadingMessage.set('Importando clientes...');

    const loadingToast = await this.toastController.create({
      message: 'Esta operación puede tardar unos minutos debido a la cantidad de clientes',
      duration: 5000,
      position: 'top',
      color: 'primary',
      icon: 'information-circle'
    });
    await loadingToast.present();

    this.clientsService.getCustomers().subscribe({
      next: async (response: Customer[]) => {
        console.log('Clients imported successfully:', response);
        this.loadingMessage.set('Guardando clientes en base de datos local...');
        
        try {
          const saveResult = await this.sqliteClientsService.replaceAllClients(response);
          
          this.isLoading.set(false);
          this.loadingMessage.set('Importando clientes...');
          
          if (saveResult.errors.length > 0) {
            await this.showWarningAlert(
              'Importación parcial de clientes',
              `${saveResult.success} clientes guardados exitosamente. ${saveResult.errors.length} errores encontrados.`,
              saveResult.errors
            );
          } else {
            await this.showSuccessToast(`Base de datos actualizada: ${saveResult.success} clientes importados exitosamente`);
          }
        } catch (error) {
          this.isLoading.set(false);
          this.loadingMessage.set('Importando clientes...');
          console.error('Error updating clients database:', error);
          await this.showErrorAlert('Error al actualizar base de datos de clientes', error);
        }
      },
      error: async (error) => {
        this.isLoading.set(false);
        this.loadingMessage.set('Importando clientes...');
        console.error('Import error:', error);
        
        await this.showErrorAlert('Error al importar clientes', error);
      }
    });
  }

  async importArticles() {
    this.isLoading.set(true);
    this.loadingMessage.set('Conectando con el servidor...');

    // Mostrar toast informativo para operaciones largas
    const loadingToast = await this.toastController.create({
      message: 'Esta operación puede tardar unos minutos debido a la cantidad de artículos',
      duration: 5000,
      position: 'top',
      color: 'primary',
      icon: 'information-circle'
    });
    await loadingToast.present();

    this.itemsService.getArticles().subscribe({
      next: async (response: Article[]) => {
        console.log('Articles imported successfully:', response);
        this.loadingMessage.set('Guardando artículos en base de datos local...');
        
        try {
          // Operación atómica: limpiar y guardar en una sola transacción
          const saveResult = await this.sqliteArticlesService.replaceAllArticles(response);
          
          this.isLoading.set(false);
          this.loadingMessage.set('Importando artículos...');
          
          if (saveResult.errors.length > 0) {
            // Algunos artículos fallaron
            await this.showWarningAlert(
              'Importación parcial',
              `${saveResult.success} artículos guardados exitosamente. ${saveResult.errors.length} errores encontrados.`,
              saveResult.errors
            );
          } else {
            // Todos los artículos se guardaron exitosamente
            await this.showSuccessToast(`Base de datos actualizada: ${saveResult.success} artículos importados exitosamente`);
          }
        } catch (error) {
          this.isLoading.set(false);
          this.loadingMessage.set('Importando artículos...');
          console.error('Error updating articles database:', error);
          await this.showErrorAlert('Error al actualizar base de datos', error);
        }
      },
      error: async (error) => {
        this.isLoading.set(false);
        this.loadingMessage.set('Importando artículos...');
        console.error('Import error:', error);
        
        // Mostrar mensaje de error mejorado
        await this.showImportErrorAlert(error);
      }
    });
  }

  private async showSuccessToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'top',
      color: 'success',
      icon: 'checkmark-circle'
    });
    await toast.present();
  }

  private async showErrorAlert(title: string, error: any) {
    const errorMessage = error?.error?.message || error?.message || 'Error desconocido';

    const alert = await this.alertController.create({
      header: title,
      message: `Ha ocurrido un error al importar los artículos: ${errorMessage}`,
      buttons: [
        {
          text: 'Reintentar',
          handler: () => {
            this.importArticles();
          }
        },
        {
          text: 'Cerrar',
          role: 'cancel'
        }
      ]
    });
    await alert.present();
  }

  private async showErrorToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 4000,
      position: 'top',
      color: 'danger',
      icon: 'alert-circle'
    });
    await toast.present();
  }

  private async showWarningAlert(title: string, message: string, errors: string[]) {
    const errorList = errors.slice(0, 5).join('\n'); // Mostrar solo los primeros 5 errores
    const moreErrors = errors.length > 5 ? `\n... y ${errors.length - 5} errores más` : '';
    
    const alert = await this.alertController.create({
      header: title,
      message: `${message}\n\nDetalles de errores:\n${errorList}${moreErrors}`,
      buttons: [
        {
          text: 'Ver en consola',
          handler: () => {
            console.warn('Errores de importación:', errors);
          }
        },
        {
          text: 'Aceptar',
          role: 'cancel'
        }
      ]
    });
    await alert.present();
  }

  private async showImportErrorAlert(error: any) {
    const errorMessage = error.message || 'Error desconocido';
    const isTimeoutError = errorMessage.includes('tardó demasiado') || errorMessage.includes('Tiempo de espera');
    
    const alert = await this.alertController.create({
      header: isTimeoutError ? 'Timeout en la importación' : 'Error de importación',
      message: errorMessage,
      buttons: [
        {
          text: 'Reintentar',
          handler: () => {
            this.importArticles();
          }
        },
        {
          text: 'Importar por lotes',
          handler: () => {
            this.importArticlesPaginated();
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

  // Método alternativo para importación por lotes
  async importArticlesPaginated() {
    this.isLoading.set(true);
    this.loadingMessage.set('Importando artículos por lotes...');
    
    try {
      // Limpiar artículos existentes primero
      await this.sqliteArticlesService.clearAllArticles();
      
      let allArticles: Article[] = [];
      let page = 0;
      let hasMore = true;
      
      while (hasMore) {
        this.loadingMessage.set(`Importando lote ${page + 1}...`);
        
        try {
          const batch = await this.itemsService.getArticlesPaginated(page, 500).toPromise();
          
          if (batch && batch.content) {
            allArticles.push(...batch.content);
            hasMore = !batch.last;
            page++;
            
            // Guardar cada lote inmediatamente
            await this.sqliteArticlesService.saveMultipleArticles(batch.content);
          } else {
            hasMore = false;
          }
        } catch (batchError) {
          console.error(`Error en lote ${page + 1}:`, batchError);
          hasMore = false;
          
          if (allArticles.length > 0) {
            await this.showWarningAlert(
              'Importación interrumpida',
              `Se importaron ${allArticles.length} artículos antes del error`,
              [`Error en lote ${page + 1}: ${batchError}`]
            );
          } else {
            await this.showErrorAlert('Error en importación por lotes', batchError);
          }
        }
      }
      
      this.isLoading.set(false);
      this.loadingMessage.set('Importando artículos...');
      
      if (allArticles.length > 0) {
        await this.showSuccessToast(`Importación por lotes completada: ${allArticles.length} artículos importados`);
      }
      
    } catch (error) {
      this.isLoading.set(false);
      this.loadingMessage.set('Importando artículos...');
      console.error('Error in paginated import:', error);
      await this.showErrorAlert('Error en importación por lotes', error);
    }
  }

  // Recrear la base de datos manualmente
  async recreateDatabase() {
    const alert = await this.alertController.create({
      header: 'Recrear Base de Datos',
      message: 'Esto eliminará todos los artículos guardados localmente y recreará la estructura de la base de datos. ¿Continuar?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Recrear',
          handler: async () => {
            this.isLoading.set(true);
            this.loadingMessage.set('Recreando base de datos...');

            try {
              await this.sqliteArticlesService.recreateDatabase();
              this.isLoading.set(false);
              this.loadingMessage.set('Importando artículos...');
              
              await this.showSuccessToast('Base de datos recreada exitosamente');
            } catch (error) {
              this.isLoading.set(false);
              this.loadingMessage.set('Importando artículos...');
              console.error('Error recreating database:', error);
              await this.showErrorAlert('Error al recrear base de datos', error);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // Verificar estado de la base de datos
  async checkDatabaseStatus() {
    this.isLoading.set(true);
    this.loadingMessage.set('Verificando base de datos...');

    try {
      const status = await this.sqliteArticlesService.checkDatabaseHealth();
      const articlesCount = status.hasStore ? await this.sqliteArticlesService.getArticlesCount() : 0;
      
      this.isLoading.set(false);
      this.loadingMessage.set('Importando artículos...');

      const statusMessage = `
Estado de la Base de Datos:
• Existe: ${status.exists ? '✅ Sí' : '❌ No'}
• Tiene tabla de artículos: ${status.hasStore ? '✅ Sí' : '❌ No'}
• Versión: ${status.version}
• Artículos almacenados: ${articlesCount}
      `;

      const alert = await this.alertController.create({
        header: 'Estado de la Base de Datos',
        message: statusMessage.trim(),
        buttons: [
          {
            text: 'Aceptar'
          },
          ...((!status.exists || !status.hasStore) ? [{
            text: 'Recrear DB',
            handler: () => {
              this.recreateDatabase();
            }
          }] : [])
        ]
      });

      await alert.present();

    } catch (error) {
      this.isLoading.set(false);
      this.loadingMessage.set('Importando artículos...');
      console.error('Error checking database status:', error);
      await this.showErrorAlert('Error al verificar base de datos', error);
    }
  }
}
