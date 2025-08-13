import { Injectable } from '@angular/core';
import { Router } from '@angular/router'
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { UserService } from '../services/user.service';

@Injectable({
  providedIn: 'root'
})

export class AuthGuard implements CanActivate {

  constructor(private _userService: UserService, private _router: Router) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return new Promise((resolve, reject) => {
      this._userService.getUserDetails().subscribe(value => {
        let user = JSON.parse(localStorage.getItem('CSIPUser') || '{}');
        if (value != undefined && Object.keys(value).length > 0 || Object.keys(user).length > 0) {
          resolve(true);
        } else {
          this._router.navigate(['/login'])
          resolve(false);
        }
      })
    })
  }

}
