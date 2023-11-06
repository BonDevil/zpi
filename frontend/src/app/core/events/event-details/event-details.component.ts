import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { EventService } from '../event.service';
import { AccountService } from '../../account/account.service';
import { Event } from '../../models';

@Component({
  selector: 'app-event-details',
  templateUrl: './event-details.component.html',
  styleUrls: ['./event-details.component.css']
})
export class EventDetailsComponent {
  eventId!: number;
  event!: Event;
  isSignUpDisabled = false;

  constructor(private route: ActivatedRoute, private router: Router, private eventService: EventService, private authService: AccountService) { }

  ngOnInit() {
    this.route.queryParamMap.subscribe(async params => {
      const eventId = params.get('id');
      if (eventId) {
        this.eventId = parseInt(eventId, 10)
        this.event = await this.eventService.getEventById(this.eventId);
        console.log(this.event);
      }
    });
    if (!this.event.isPublic && !this.authService.isLoggedIn()) {
      this.isSignUpDisabled = true;
    }
  }

  goBack() {
    window.history.back();
  }

  isSignedUp(): boolean {
    return this.eventService.isSignedUp(this.eventId);
  }

  isOrganiser(): boolean {
    return this.eventService.isOrganiser(this.eventId);
  }

  signUp() {
    this.router.navigate(['/event/sign-up'], {
      queryParams: { id: this.eventId },
      relativeTo: this.route,
    });
  }

  signOut() {
    this.eventService.signOut(this.eventId);
    window.location.reload();
  }

  edit() {
    this.router.navigate(['/event/edit'], {
      queryParams: { id: this.eventId },
      relativeTo: this.route,
    });
  }

  async delete() {
    await this.eventService.deleteEvent(this.eventId);
    this.goBack();
  }
}
