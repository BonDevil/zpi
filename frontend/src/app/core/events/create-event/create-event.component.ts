import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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

  constructor(private fb: FormBuilder, private router: Router, private eventService: EventService) {
    this.createEventForm = this.fb.group({
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
  }

  async publish() {
    const formData = this.createEventForm.value;
    if (this.createEventForm.valid) {
      const newEvent = this.createEventForm.value as Event;
      newEvent.categories = this.selectedCategories;
      const eventId = await this.eventService.addEvent(newEvent);
      this.router.navigate(['/event'], {
        queryParams: { id: eventId }
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
