import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { isDevMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { setAssetPath } from '@stencil/core';
import { addIcons } from 'ionicons';
import {
  add,
  addOutline,
  apps,
  appsOutline,
  appsSharp,
  archive,
  archiveOutline,
  bookmark,
  bookmarkOutline,
  business,
  businessOutline,
  car,
  cart,
  cartOutline,
  cartSharp,
  chevronForward,
  chevronForwardOutline,
  create,
  createOutline,
  cube,
  cubeOutline,
  cubeSharp,
  heart,
  heartOutline,
  lockClosedOutline,
  logOutOutline,
  logOutSharp,
  mail,
  mailOutline,
  paperPlane,
  paperPlaneOutline,
  people,
  peopleOutline,
  person,
  personOutline,
  receipt,
  receiptOutline,
  settings,
  settingsOutline,
  storefront,
  trash,
  trashOutline,
  warning,
  warningOutline
} from 'ionicons/icons';
import { routes } from './app/app-routing.module';
import { AppComponent } from './app/app.component';
import { authInterceptor } from './app/interceptors/auth.interceptor';

// Registrar iconos
addIcons({
  'mail': mail,
  'mail-outline': mailOutline,
  'paper-plane': paperPlane,
  'paper-plane-outline': paperPlaneOutline,
  'heart': heart,
  'heart-outline': heartOutline,
  'archive': archive,
  'archive-outline': archiveOutline,
  'trash': trash,
  'trash-outline': trashOutline,
  'warning': warning,
  'warning-outline': warningOutline,
  'bookmark': bookmark,
  'bookmark-outline': bookmarkOutline,
  'business': business,
  'business-outline': businessOutline,
  'car': car,
  'storefront': storefront,
  'person': person,
  'person-outline': personOutline,
  'people': people,
  'people-outline': peopleOutline,
  'receipt': receipt,
  'receipt-outline': receiptOutline,
  'lock-closed-outline': lockClosedOutline,
  'log-out-outline': logOutOutline,
  'log-out-sharp': logOutSharp,
  'settings': settings,
  'settings-outline': settingsOutline,
  'apps': apps,
  'apps-outline': appsOutline,
  'apps-sharp': appsSharp,
  'cart': cart,
  'cart-outline': cartOutline,
  'cart-sharp': cartSharp,
  'add': add,
  'add-outline': addOutline,
  'chevron-forward': chevronForward,
  'chevron-forward-outline': chevronForwardOutline,
  'create': create,
  'create-outline': createOutline,
  'cube': cube,
  'cube-outline': cubeOutline,
  'cube-sharp': cubeSharp
});

// Set asset path for icons
setAssetPath('./svg/');

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideIonicAngular({
      mode: 'md',
      innerHTMLTemplatesEnabled: true,
      _forceStatusbarPadding: true
    }),
    provideHttpClient(withInterceptors([authInterceptor])), provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          })
  ]
}).catch(err => console.log(err));
