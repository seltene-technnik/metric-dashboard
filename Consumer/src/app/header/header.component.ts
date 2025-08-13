import { Component, OnInit } from '@angular/core';
import { UserService } from '../services/user.service';
import { NavigationEnd, Router } from '@angular/router'

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  enableMenu: boolean = false
  username: string = ''
  enableUserMenu: boolean = false
  adminFlag: boolean = false;
  isInAdminPanel: boolean = false;

  constructor(private _userService: UserService, private _router: Router) { }

  ngOnInit(): void {
    this._router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.isInAdminPanel = this._router.url.startsWith('/admin');
      }
    });
    this._userService.getUserDetails().subscribe((value: any) => {
      if (value != undefined && Object.keys(value).length > 0) {
        this.username = `${value.firstName.substring(0, 1)}${value.lastName.substring(0, 1)}`
        this.enableMenu = true
        this.adminFlag = value.roleId == 1 ? true : false;
      } else {
        this.adminFlag = false;
        this.enableMenu = false
      }
    })
    this._userService.getUserMenu().subscribe((value: any) => {
      if (value === true) {
        this.enableUserMenu = true
      } else {
        this.enableUserMenu = false
      }
    })
  }

  /**
   * @author Nagendra
   * @uses To logout user
   */
  logout() {
    this._userService.setUserDetails({})
    this._userService.setUserMenu(false)
    sessionStorage.clear();
    localStorage.clear();
    this._router.navigate(['/login'])
  }

}
