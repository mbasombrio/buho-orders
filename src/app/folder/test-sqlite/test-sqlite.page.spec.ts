import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestSqlitePage } from './test-sqlite.page';

describe('TestSqlitePage', () => {
  let component: TestSqlitePage;
  let fixture: ComponentFixture<TestSqlitePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TestSqlitePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
