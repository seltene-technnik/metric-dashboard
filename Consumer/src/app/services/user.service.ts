import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  public details = new BehaviorSubject({});
  public schoolId = new BehaviorSubject(null);
  public priorityType = new BehaviorSubject(null);
  public isLoading = new BehaviorSubject(false);
  public enableUsers = new BehaviorSubject(false);
  public academicYearId = new BehaviorSubject(null);
  public academicYears = new BehaviorSubject([]);

  constructor() { }

  /**
   * @author Nagendra
   * @param value 
   */
  setUserDetails(value: any) {
    this.details.next(value)
  }

  /**
   * @author Nagendra
   * @returns 
   */
  getUserDetails() {
    return this.details
  }

  /**
   * @author Nagendra
   * @param value 
   */
  setSchoolId(value: any) {
    this.schoolId.next(value)
  }

  /**
   * @author Nagendra
   * @returns 
   */
  getSchoolId() {
    return this.schoolId
  }

  /**
 * @author Nagendra
 * @param value 
 */
  setPriorityType(value: any) {
    this.priorityType.next(value)
  }

  /**
   * @author Nagendra
   * @returns 
   */
  getPriorityType() {
    return this.priorityType
  }

  setSpinner(isSpin: boolean) {
    this.isLoading.next(isSpin);
  }

  getSpinner() {
    return this.isLoading;
  }

  setUserMenu(visible: boolean) {
    this.enableUsers.next(visible);
  }

  getUserMenu() {
    return this.enableUsers;
  }

  setAcademicYearId(value: any) {
    this.academicYearId.next(value)
  }

  getAcademicYearId() {
    return this.academicYearId
  }

  setAcademicYears(value : any) {
    this.academicYears.next(value)
  }

  getAcademicYears() {
    return this.academicYears
  }

}
