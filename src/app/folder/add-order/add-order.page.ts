import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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

  constructor() { }

  ngOnInit() {
  }

}
