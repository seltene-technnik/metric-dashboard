import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataTargetComponent } from './data-target.component';

describe('DataTargetComponent', () => {
  let component: DataTargetComponent;
  let fixture: ComponentFixture<DataTargetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DataTargetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DataTargetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
