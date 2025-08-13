import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment'
import { UserService } from '../services/user.service'
import { Router } from '@angular/router'
import { AjaxService } from '../services/ajax.service'
import { Subscription } from 'rxjs'

declare var Msal: any
declare var google: any

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})

export class LoginComponent implements OnInit {
  invalid: boolean = false
  userSubscription: Subscription[] = []
  userExist: boolean = false
  signup: boolean = false

  constructor(private _userService: UserService, private _router: Router, private _ajaxService: AjaxService) { }


  ngOnInit(): void {
    this.userSubscription.push(this._userService.getUserDetails().subscribe(value => {
      if (value != undefined && Object.keys(value).length > 0) {
        this._router.navigate(['/dashboard'])
      } else if (localStorage.getItem('CSIPUser') != null) {
        const user = JSON.parse(localStorage.getItem('CSIPUser') || '{}')
        this._userService.setUserDetails(user);
        this._router.navigate(['/dashboard'])
      }
    }))
  }

  swichToSignup() {
    this.signup = !this.signup
  }

  /**
   * @author Nagendra
   * @uses To authenticate with Google
   */
  googleSignIn() {
    this.invalid = false
    const client = google.accounts.oauth2.initTokenClient({
      client_id: environment.gClientId,
      ux_mode: 'popup',
      scope: 'openid profile email',
      callback: (response: any) => {
        const component = this;
        if (response.access_token) {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', 'https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=' + response.access_token);
          xhr.onreadystatechange = function (e) {
            if (xhr.readyState === 4 && xhr.status === 200) {
              const result = xhr.response;
              const userInfo = (JSON.parse(result))
              let lastName = ''
              if (component.signup) {
                if (userInfo.family_name) {
                  lastName = userInfo.family_name
                }
                component.signUp(userInfo.email, userInfo.given_name, lastName)
              } else {
                component.login(userInfo.email)
              }
            } else if (xhr.readyState === 4 && xhr.status === 401) {
            }
          };
          xhr.send(null);
        }
      },
    });
    client.requestAccessToken()
  }

  /**
   * @author Nagendra
   * @uses To authenticate with MS
   */
  async MSLogin() {
    sessionStorage.clear();
    this.invalid = false
    const msalConfig = {
      auth: {
        clientId: environment.msClientId,
        authority: "https://login.microsoftonline.com/common",
        redirectUri: environment.msRedirectUri,
      },
      cache: {
        cacheLocation: "sessionStorage", // This configures where your cache will be stored
        storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
      }
    };
    const myMSALObj = new Msal.UserAgentApplication(msalConfig);
    // Add scopes for the id token to be used at Microsoft identity platform endpoints.
    const loginRequest = {
      scopes: ["openid", "profile", "User.Read"],
    };
    myMSALObj.loginPopup(loginRequest)
      .then((loginResponse: any) => {
        const email = loginResponse.account.userName;
        if (this.signup) {
          let firstName = ''
          let lastName = ''
          try {
            let nameArray = loginResponse.account.name.split(' ')
            firstName = nameArray[0]
            lastName = nameArray[1]
          } catch {
            firstName = loginResponse.account.name
          }
          this.signUp(email, firstName, lastName)
        } else {
          this.login(email);
        }
      }).catch(function (error: any) {
        console.log(error);
      });
  }

  /**
   * @author Nagendra
   * @uses To login through SSO
   * @param email 
   */
  login(email: string) {
    const request = {
      "email": email
    }
    this._ajaxService.post("users/login", request).then((response: any) => {
      if (response.statusCode == 200) {
        const user = {
          firstName: response.data['firstName'],
          lastName: response.data['lastName'],
          email: response.data['email'],
          roleId: response.data['roleId'],
          userId : response.data['userId']
        }
        localStorage.setItem('schools', JSON.stringify(response.data['schools']))
        localStorage.setItem('CSIPUser', JSON.stringify(user));
        this._userService.setUserDetails(user);
        user.roleId == 5 ? this._router.navigate(['/admin']) : this._router.navigate(['/dashboard'])
      } else if (response.statusCode == 401) {
        this.invalid = true
      }
    })
  }

  /**
   * @author Manjunath
   * @uses To sign up
   */
  signUp(email: string, firstName: string, lastName: string) {
    const request = {
      "firstName": firstName,
      "lastName": lastName,
      "email": email,
      "roleId": 3,
    }
    this._ajaxService.post("users/signUp", request).then((respoanse: any) => {
      if (respoanse.statusCode == 200) {
        this.signup = false
        this.login(email)
      } else if (respoanse.statusCode == 401) {
        this.userExist = true;
        setTimeout(() => {
          this.userExist = false
        }, 5000)
      }
    })
  }

  ngOnDestroy() {
    this.userSubscription.forEach(value => {
      value.unsubscribe();
    })
  }

}
