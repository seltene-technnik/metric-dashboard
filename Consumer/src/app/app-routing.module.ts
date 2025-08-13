import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { Page404Component } from './page404/page404.component';
import { SchoolComponent } from './school/school.component';
import { GoalComponent } from './goal/goal.component';
import { AuthGuard } from './guards/auth.guard';
import { InterventionsComponent } from './interventions/interventions.component';
import { UsersComponent } from './users/users.component';
import { AdminComponent } from './admin/admin.component';
import { GradesComponent } from './grades/grades.component';
import { PdPlanComponent } from './pd-plan/pd-plan.component';
import { DataAssessmentPlanComponent } from './data-assessment-plan/data-assessment-plan.component';
import { DataTargetComponent } from './data-target/data-target.component';

const routes: Routes = [
  { 'path': '', component: LoginComponent },
  { 'path': 'grades/:data', component: GradesComponent, canActivate: [AuthGuard] },
  { 'path': 'pdplan', component: PdPlanComponent, canActivate: [AuthGuard] },
  { 'path': 'dataplan', component: DataAssessmentPlanComponent, canActivate: [AuthGuard] },
  { 'path': 'login', component: LoginComponent },
  { 'path': 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { 'path': 'school', component: SchoolComponent, canActivate: [AuthGuard] },
  { 'path': 'planning', component: GoalComponent, canActivate: [AuthGuard] },
  { 'path': 'interventions', component: InterventionsComponent, canActivate: [AuthGuard] },
  { 'path': 'dataTarget', component: DataTargetComponent, canActivate: [AuthGuard] },
  { 'path': 'users', component: UsersComponent, canActivate: [AuthGuard] },
  { 'path': 'admin', component: AdminComponent, canActivate: [AuthGuard], data: { isAdminPanel: true } },
  { 'path': '**', component: Page404Component }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
