import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AccountService } from '../account.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent {
  emailForm: FormGroup;
  resetForm: FormGroup;
  keySent: boolean = false;
  resetFailed: boolean = false;

  constructor(private fb: FormBuilder, private accountService: AccountService, private router: Router) {
    this.emailForm = this.fb.group({
      email: ['', Validators.required]
    });
    this.resetForm = this.fb.group({
      email: ['', Validators.required],
      newPassword: ['', Validators.required],
      validationKey: ['', Validators.required]
    });
  }

  ngOnInit() {}

  async sendKey() {
    if (await this.accountService.sendKey(this.emailForm.value.email)) {
      this.keySent = true;
    } else {
      this.keySent = false;
    }
  }

  async reset() {
    if (await this.accountService.resetPassword(this.resetForm.value.email, this.resetForm.value.password, this.resetForm.value.validationKey)) {
      this.resetFailed = false;
      window.location.reload();
    } else {
      this.resetFailed = true;
    }
  }

  goBackToLogin() {
    this.router.navigate(['/login']);
  }
}
