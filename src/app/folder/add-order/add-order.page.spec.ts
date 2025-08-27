import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddOrderPage } from './add-order.page';

describe('AddOrderPage', () => {
  let component: AddOrderPage;
  let fixture: ComponentFixture<AddOrderPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AddOrderPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
