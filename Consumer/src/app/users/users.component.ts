import { Component, OnInit, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormControl, FormGroup, Validators, FormBuilder } from '@angular/forms';
import { AjaxService } from '../services/ajax.service'
import { Subscription } from 'rxjs'
import { UserService } from '../services/user.service'
import { Router } from '@angular/router'

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {

  user: FormGroup = this._formBuilder.group({
    'firstName': ['', Validators.required],
    'lastName': ['', Validators.required],
    'email': ['', [Validators.required, Validators.email, , this.noWhitespace]]
  })
  userSubscription: Subscription[] = []
  schoolId: number = 0
  users: Array<any> = []
  submitted: boolean = false
  userExist: boolean = false
  userSuccess: boolean = false

  @ViewChild('myModal') myModal: any;

  constructor(private modalService: NgbModal, private _formBuilder: FormBuilder, private _ajaxService: AjaxService, private _userService: UserService, private _router: Router) { }

  ngOnInit(): void {
    this.userSubscription.push(this._userService.getSchoolId().subscribe(value => {
      if (value != null) {
        this.schoolId = value
        this.getUsersList()
      } else {
        this._router.navigate(['/dashboard'])
      }
    }))
  }

  openModal() {
    this.submitted = false
    this.userExist = false
    this.userSuccess = false
    this.user.reset()
    this.modalService.open(this.myModal);
  }

  public noWhitespace(control: FormControl) {
    let isWhitespace = (control.value || '').trim().length === 0;
    let isValid = !isWhitespace;
    return isValid ? null : { 'whitespace': true }
  }

  get userControls() {
    return this.user.controls
  }

  /**
   * @author Nagendra
   * @uses To create guest user
   */
  createGuestUser() {
    this.submitted = true
    this.userExist = false
    this.userSuccess = false
    if (this.user.valid) {
      const request = {
        "firstName": this.user.get('firstName')?.value,
        "lastName": this.user.get('lastName')?.value,
        "email": this.user.get('email')?.value,
        "roleId": 4,
        "schoolID": this.schoolId
      }
      this._ajaxService.post(`users/create`, request).then((response: any) => {
        if (response.statusCode == 200) {
          if (response.message != 'success') {
            this.userExist = true
            setTimeout(() => {
              this.userExist = false
            }, 2000)
          } else {
            this.getUsersList()
            this.userSuccess = true
            setTimeout(() => {
              this.modalService.dismissAll()
              this.reset()
            }, 2000)
          }
        }
      })
    } else {
      this.user.markAllAsTouched()
    }
  }

  /**
   * @author Nagendra
   * @uses To get users list  
   */
  getUsersList() {
    this.users = []
    this._ajaxService.get(`users/list?schoolID=${this.schoolId}`).then((response: any) => {
      if (response.statusCode == 200) {
        this.users = response.data
      }
    })
  }

  /**
   * @author Nagendra
   * @uses To reset 
   */
  reset() {
    this.submitted = false
    this.userExist = false
    this.userSuccess = false
    this.user.reset()
  }

  /**
   * @author Nagendra
   * @param userId 
   */
  updateStatus(index: number) {
    const request = {
      "userId": this.users[index].id,
      "isActive": this.users[index].isActive == 1 ? 0 : 1,
      "schoolId": this.schoolId
    }
    this._ajaxService.post(`users/updateStatus`, request).then((response: any) => {
      if (response.statusCode == 200) { }
    })
  }

  /**
   * @author Nagendra
   */
  ngOnDestroy() {
    this.userSubscription.forEach(value => {
      value.unsubscribe();
    })
  }

}
