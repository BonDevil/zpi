import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../event.service';
import { Event } from '../../models';

@Component({
  selector: 'app-edit-event',
  templateUrl: './edit-event.component.html',
  styleUrls: ['./edit-event.component.css']
})
export class EditEventComponent implements OnInit {
  editEventForm!: FormGroup;
  categories: string[] = [];
  selectedCategories: string[] = [];
  newCategory: string = '';
  eventId!: number;
  event!: Event;
  modalText = '';
  errors = '';
  selectedFile = undefined;

  constructor(private fb: FormBuilder, private route: ActivatedRoute, private router: Router, private eventService: EventService) {
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
    this.editEventForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      location: ['', Validators.required],
      is_public: [false, Validators.required],
      price: [null, [Validators.required, nonNegativeValidator]],
      capacity: [null, [nonNegativeValidator]],
      registration_end_date: [null, Validators.required],
      start_date: [null, Validators.required],
      end_date: [null, Validators.required],
      created_at: [null],
      updated_at: [null],
      user: [null],
      user_email: [null],
      categories: [null],
      photo: [null],
    }, { validator: dateValidator });
  }

  async ngOnInit() {
    this.categories = await this.eventService.getCategories();
    this.route.queryParamMap.subscribe(async params => {
      const eventId = params.get('id');
      if (eventId) {
        this.eventId = parseInt(eventId, 10)
        this.event = await this.eventService.getEventById(this.eventId);
        this.editEventForm = this.fb.group({
          title: this.event.title,
          description: this.event.description,
          location: this.event.location,
          is_public: this.event.is_public,
          price: Number(this.event.price),
          capacity: this.event.capacity,
          remaining_slots: this.event.remaining_slots,
          registration_end_date: new Date(this.event.registration_end_date),
          start_date: new Date(this.event.start_date),
          end_date: new Date(this.event.end_date),
          created_at: this.event.created_at,
          updated_at: this.event.updated_at,
          user: this.event.user,
          user_email: this.event.user_email,
          photo: this.event.photo,
        });
        if(this.event.categories){
          this.selectedCategories = this.event.categories;
        }
      }
    });
    
  }

  async publish() {
    const formData = this.editEventForm.value;
    try{
      if (this.editEventForm.valid) {
        let newEvent = this.editEventForm.value as Event;
        newEvent.categories = this.selectedCategories;
        newEvent.updated_at = new Date();
        newEvent.price = this.editEventForm.value.price.toString();
        newEvent.photo = this.selectedFile;
        await this.eventService.editEvent(this.eventId, newEvent);
        this.router.navigate(['/event'], {
          queryParams: { id: this.eventId }
        });
      }
      else{
        this.errors = "";
        Object.keys(this.editEventForm.controls).forEach(controlName => {
          const control = this.editEventForm.get(controlName);
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

  goBackToEvent() {
    this.router.navigate(['/event'], {
      queryParams: { id: this.eventId }
    });
  }
}
