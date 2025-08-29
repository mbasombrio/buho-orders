import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-add-order',
  templateUrl: './add-order.page.html',
  styleUrls: ['./add-order.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule
  ]

})
export class AddOrderPage implements OnInit {

  priceList = [
    { id: 1, name: 'Lista 1'},
    { id: 2, name: 'Lista 2'},
    { id: 3, name: 'Lista 3'},
    { id: 4, name: 'Lista 4'},
    { id: 5, name: 'Lista 5'}
  ];

  sentOptions = [
    { id: 1, name: 'Retiro en local'},
    { id: 2, name: 'Envio a Domicilio'}
  ];

  form = new FormGroup({
    state: new FormControl('Pending', Validators.required),
    customer: new FormControl<string>('', Validators.required),
    tender: new FormControl(null),
    send: new FormControl('RETIRO_LOCAL'),
    branch: new FormControl(null, Validators.required),
    observation: new FormControl(null),
    listPrice: new FormControl(1),
  })

   formDelivery: FormGroup = new FormGroup({
    id: new FormControl(null),
    city: new FormControl(null, Validators.required),
    name: new FormControl(null, Validators.required),
    lastName: new FormControl(null, Validators.required),
    email: new FormControl(null, Validators.required),
    cellphone: new FormControl(null, Validators.required),
    address: new FormControl(null, Validators.required),
    zipCode: new FormControl(null, Validators.required),
    state: new FormControl(null, Validators.required),
  });


  constructor() { }

  ngOnInit() {
  }

}
