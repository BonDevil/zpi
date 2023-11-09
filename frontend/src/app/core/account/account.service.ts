import { HttpClient, HttpRequest, HttpInterceptor, HttpHandler, HttpEvent, } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, firstValueFrom, map, Observable } from 'rxjs';
import { User } from '../models';
import { CookieService} from 'ngx-cookie-service';

@Injectable()
export class NoopInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler):
    Observable<HttpEvent<any>> {
      return next.handle(req);
    }
}

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  cookieService = inject(CookieService);
  cookieValue = '';
  private isAuthenticated: boolean = false;
  private userIdSubject: BehaviorSubject<any> = new BehaviorSubject(null);
  public userId$ = this.userIdSubject.asObservable();

  constructor(private http: HttpClient) {
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.isAuthenticated = true;
      this.userIdSubject.next(JSON.parse(userId));
    }
  }

  async login(email: string, password: string): Promise<boolean> {
    let userData: User = 
    {
      email: email,
      password: password
    };

    /*
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      observe: 'response'
    };
    console.log(this.http.post<any>('http://127.0.0.1:8000/api/accounts/login', userData, httpOptions));
*/

    

    const userId = await firstValueFrom(
      this.http.post<User>('http://127.0.0.1:8000/api/accounts/login', userData).pipe(
        map(data => data.id)
      )
    );

    //save a test cookie
    this.cookieService.set('test', 'hello');
    this.cookieValue = this.cookieService.get('test');
    
    console.log("Logged in with id ", userId);
    if (userId) {
      this.isAuthenticated = true;
      this.userIdSubject.next({ userId: userId });
      localStorage.setItem('userId', JSON.stringify({ userId }));
    } else {
      this.isAuthenticated = false;
    }
    return this.isAuthenticated;
  }


  async logout() {
    const resp = await firstValueFrom(
      this.http.post<User>('http://127.0.0.1:8000/api/accounts/logout', {}).pipe()
    );
    this.isAuthenticated = false;
    this.userIdSubject.next(null);
    localStorage.removeItem('userId');
  }
  
  isLoggedIn(): boolean {
    const userId = this.userIdSubject.value;
    console.log("User with id ", userId, "is logged in: ", this.isAuthenticated);
    return this.isAuthenticated;
  }

  getUserId(): any {
    const userId = this.userIdSubject.value;
    console.log("User id: ", userId);
    return this.userIdSubject.value;
  }

  async getUserData(): Promise<User> {
    const userId = this.userIdSubject.value;
    const options = {
      withCredentials: true,
    };
    const userData = await firstValueFrom(
      this.http.get<User>('http://127.0.0.1:8000/api/accounts/user', options).pipe()
    );
    console.log("User ", userId, "data: ", userData);
    return userData;
  }

  async register(email: string, password: string): Promise<boolean> {
    let userData: User = 
    {
      username: email,
      email: email,
      password: password
    };
    const userId = await firstValueFrom(
      this.http.post<User>('http://127.0.0.1:8000/api/accounts/register', userData).pipe()
    );
    console.log("User id: ", userId);
    return await this.login(email, password);
  }

  updateUser(email: string, password: string): void {
    const userId = this.userIdSubject.value;
    console.log("Updated user with id: ", userId);

  }

  async deleteUser(): Promise<void> {
    const options = {
      withCredentials: true,
    };
    const resp = await firstValueFrom(
      this.http.post<User>('http://127.0.0.1:8000/api/accounts/delete-account', {}, options).pipe()
    );
    const userId = this.userIdSubject.value;
    console.log("Deleted user with id: ", userId);
    this.isAuthenticated = false;
    this.userIdSubject.next(null);
    localStorage.removeItem('userId');
  }
}