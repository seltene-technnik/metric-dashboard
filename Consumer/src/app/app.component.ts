import { Component, OnInit } from '@angular/core';
import { UserService } from '../app/services/user.service'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  enableSpinner: boolean = false

  constructor(private _userService: UserService) {
    this._userService.isLoading.subscribe(value => {
      Promise.resolve().then(() => { this.enableSpinner = value })
    })
  }

  ngOnInit() {
    if (localStorage.getItem('CSIPUser') != null) {
      const user = JSON.parse(localStorage.getItem('CSIPUser') || '{}')
      this._userService.setUserDetails(user);
    }
  }

}
