import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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

  constructor(private fb: FormBuilder, private route: ActivatedRoute, private router: Router, private eventService: EventService) {
    this.editEventForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      location: ['', Validators.required],
      isPublic: [false],
      price: [null],
      capacity: [null],
      registrationEndDate: [null],
      startDate: [null],
      endDate: [null],
      photo: [null]
    });
  }

  async ngOnInit() {
    this.categories = await this.eventService.getCategories();
    this.route.queryParamMap.subscribe(async params => {
      const eventId = params.get('id');
      if (eventId) {
        this.eventId = parseInt(eventId, 10)
        this.event = await this.eventService.getEventById(this.eventId);
        this.editEventForm = this.fb.group({
          title: [this.event.title, Validators.required],
          description: [this.event.description, Validators.required],
          location: [this.event.location, Validators.required],
          isPublic: [this.event.isPublic],
          price: [this.event.price],
          capacity: [this.event.capacity],
          registrationEndDate: [this.event.registrationEndDate],
          startDate: [this.event.startDate],
          endDate: [this.event.endDate],
          photo: [this.event.photo]
        });
        if(this.event.categories){
          this.selectedCategories = this.event.categories;
        }
      }
    });
    
  }

  async publish() {
    const formData = this.editEventForm.value;
    if (this.editEventForm.valid) {
      let newEvent = this.editEventForm.value as Event;
      newEvent.categories = this.selectedCategories;
      await this.eventService.editEvent(this.eventId, newEvent);
      this.router.navigate(['/event'], {
        queryParams: { id: this.eventId }
      });
    }
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
}
