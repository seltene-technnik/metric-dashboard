import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { environment } from 'src/environments/environment';
import { UserService } from '../services/user.service'

@Injectable({
  providedIn: 'root'
})

export class AjaxService {

  apiCount: number = 0

  constructor(private http: HttpClient, private userService: UserService) { }

  get(urlEndPoint: string) {
    this.apiCount++
    this.userService.setSpinner(true)
    return new Promise((resolve, reject) => {
      this.http.get(environment.apiUrl + urlEndPoint).subscribe(response => {
        this.apiCount--
        if (this.apiCount <= 0) {
          this.userService.setSpinner(false)
        }
        resolve(response);
      }, error => {
        this.apiCount--
        if (this.apiCount <= 0) {
          this.userService.setSpinner(false)
        }
        reject(error);
      })
    })
  }

  post(urlEndPoint: string, data: any) {
    let headers: HttpHeaders = new HttpHeaders();
    headers = headers.append('Content-Type', 'application/json');
    this.apiCount++;
    this.userService.setSpinner(true)
    return new Promise((resolve, reject) => {
      this.http.post(environment.apiUrl + urlEndPoint, data, { headers: headers }).subscribe((response: any) => {
        this.apiCount--
        if (this.apiCount <= 0) {
          this.userService.setSpinner(false)
        }
        resolve(response);
      }, error => {
        this.apiCount--
        if (this.apiCount <= 0) {
          this.userService.setSpinner(false)
        }
        reject(error);
      })
    })
  }

}
