import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdPlanComponent } from './pd-plan.component';

describe('PdPlanComponent', () => {
  let component: PdPlanComponent;
  let fixture: ComponentFixture<PdPlanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PdPlanComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PdPlanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
