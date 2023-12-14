import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EventService } from '../event.service';
import { Event } from '../../models';

@Component({
  selector: 'app-create-event',
  templateUrl: './create-event.component.html',
  styleUrls: ['./create-event.component.css']
})
export class CreateEventComponent implements OnInit {
  createEventForm: FormGroup;
  categories: string[] = [];
  selectedCategories: string[] = [];
  newCategory: string = '';
  modalText: string = '';
  errors = "";
  selectedFile = undefined;
  eventId?: number;

  constructor(private fb: FormBuilder, private router: Router, private eventService: EventService) {
    const dateValidator = (control: AbstractControl): { [key: string]: boolean } | null => {
      const startDate = control.get('start_date')?.value;
      const endDate = control.get('end_date')?.value;
      const registrationEndDate = control.get('registration_end_date')?.value;
      const today = new Date();
    
      if (startDate && endDate) {
        if (new Date(startDate) >= new Date(endDate)) {
          return { 'invalidDateRange': true }; // Start date should be before end date
        }
    
        if (new Date(startDate) < today) {
          return { 'invalidStartDate': true }; // Start date should be today or after today
        }
      }
    
      if (registrationEndDate && startDate) {
        if (new Date(registrationEndDate) >= new Date(startDate)) {
          return { 'invalidRegistrationEndDate': true }; // Registration end date should be before start date
        }
    
        if (new Date(registrationEndDate) < today) {
          return { 'invalidRegistrationEndDateToday': true }; // Registration end date should be today or after today
        }
      }
    
      return null;
    };
    const nonNegativeValidator = (control: AbstractControl): { [key: string]: boolean } | null => {
      const value = control.value;
    
      if (value !== null && value < 0) {
        return { 'nonNegative': true }; // Value cannot be negative
      }
    
      return null;
    };
    this.createEventForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      location: ['', Validators.required],
      is_public: [false, Validators.required],
      price: [null, [Validators.required, nonNegativeValidator]],
      capacity: [null, [nonNegativeValidator]],
      registration_end_date: [null, Validators.required],
      start_date: [null, Validators.required],
      end_date: [null, Validators.required],
      photo: [null],
    }, { validator: dateValidator });
  }

  async ngOnInit() {
    this.categories = await this.eventService.getCategories();
  }

  async publish() {
    const formData = this.createEventForm.value;
    try{
      if (this.createEventForm.valid) {
        const newEvent = this.createEventForm.value as Event;
        newEvent.categories = this.selectedCategories;
        newEvent.created_at = new Date();
        newEvent.updated_at = new Date();
        newEvent.price = this.createEventForm.value.price.toString();
        newEvent.photo = this.selectedFile;
        console.log(newEvent);
        const eventId = await this.eventService.addEvent(newEvent);
        this.router.navigate(['/event'], {
          queryParams: { id: eventId }
        });
      }
      else{
        this.errors = "";
        Object.keys(this.createEventForm.controls).forEach(controlName => {
          const control = this.createEventForm.get(controlName);
          if (control && control.invalid) {
            if (control.errors?.['nonNegative']) {
              this.errors += `${controlName} cannot be negative\n`;
            } else if (control.errors?.['invalidDateRange']) {
              this.errors += `Start date should be before end date\n`;
            } else if (control.errors?.['invalidStartDate']) {
              this.errors += `Start date cannot be in past\n`;
            } else if (control.errors?.['invalidRegistrationEndDate']) {
              this.errors += `Registration end date should be before start date\n`;
            } else if (control.errors?.['invalidRegistrationEndDateToday']) {
              this.errors += `Registration end date cannot be in past\n`;
            } else {
              this.errors += `${controlName} is required\n`;
            }
          }
        });
        throw new Error(this.errors);
      }
    }
    catch (e: any){
      if (e instanceof Error){
        this.modalText = e.message;
      }
      else{
        this.modalText = '';
        e.error.forEach((element: any) => {
          element.forEach((error_message: any) =>{
            this.modalText += error_message + '\n';
          });
        });
      }
      document.getElementById("openModal1")?.click();
    }
  }

  onFileSelected(event: any){
    this.selectedFile = event.target.files[0];
    console.log(this.selectedFile);
  }

  addCategory(category: string) {
    if (!this.isCategorySelected(category)) {
      this.selectedCategories.push(category);
    }
  }
  
  removeSelectedCategory(categoryToRemove: string) {
    if (this.selectedCategories !== null) {
      const index = this.selectedCategories.indexOf(categoryToRemove);
      if (index !== -1) {
        this.selectedCategories.splice(index, 1);
      }
    }
  }

  isCategorySelected(category: string): boolean {
    return this.selectedCategories !== null && this.selectedCategories.includes(category);
  }

  goBack() {
    this.router.navigate(['/home']);
  }

}
