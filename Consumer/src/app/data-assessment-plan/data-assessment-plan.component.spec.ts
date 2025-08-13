import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataAssessmentPlanComponent } from './data-assessment-plan.component';

describe('DataAssessmentPlanComponent', () => {
  let component: DataAssessmentPlanComponent;
  let fixture: ComponentFixture<DataAssessmentPlanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DataAssessmentPlanComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DataAssessmentPlanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
