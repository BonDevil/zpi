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
  resetForm: FormGroup;
  resetFailed: boolean = false;

  constructor(private fb: FormBuilder, private accountService: AccountService, private router: Router) {
    this.resetForm = this.fb.group({
      email: ['', Validators.required],
      newPassword: ['', Validators.required],
      validationKey: ['', Validators.required]
    });
  }

  ngOnInit() {}

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
