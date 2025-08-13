import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { LoginComponent } from './login/login.component';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { Page404Component } from './page404/page404.component';
import { SchoolComponent } from './school/school.component';
import { GoalComponent } from './goal/goal.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InterventionsComponent } from './interventions/interventions.component';
import { UsersComponent } from './users/users.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {TextFieldModule} from '@angular/cdk/text-field';
import { AdminComponent } from './admin/admin.component';
// import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { GradesComponent } from './grades/grades.component';
import { PdPlanComponent } from './pd-plan/pd-plan.component';
import { DataAssessmentPlanComponent } from './data-assessment-plan/data-assessment-plan.component';
import { DataTargetComponent } from './data-target/data-target.component';
import { AcademicYearComponent } from './academic-year/academic-year.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    HeaderComponent,
    FooterComponent,
    DashboardComponent,
    Page404Component,
    SchoolComponent,
    GoalComponent,
    InterventionsComponent,
    UsersComponent,
    AdminComponent,
    GradesComponent,
    PdPlanComponent,
    DataAssessmentPlanComponent,
    DataTargetComponent,
    AcademicYearComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    TextFieldModule,
    MatSnackBarModule,
    MatFormFieldModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
