import { Injectable } from '@angular/core';
import { EventRegistration, EventsFilter } from '../models';
import { Event, Category} from '../models';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom, map } from 'rxjs';
import { AccountService } from '../account/account.service';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private categories: string[] = ['Sports', 'Competition', 'Volleyball', 'Dance', 'Performance', 'Education', 'Tutoring', 'Art', 'Crafts'];
  private events: Event[] = [
    {
      id: 1,
      title: 'Volleyball group',
      description: 'Join our exciting volleyball group.',
      location: 'Sports Arena 1',
      isPublic: true,
      price: 10,
      capacity: 100,
      remainingSlots: 100,
      registrationEndDate: new Date('2023-12-15T12:00:00'),
      startDate: new Date('2024-01-20T09:00:00'),
      endDate: new Date('2024-01-22T18:00:00'),
      createdAt: new Date(),
      updatedAt: new Date(),
      user: 1,
      userEmail: 'volleyballclub@example.com',
      categories: ['Sports', 'Competition', 'Volleyball'],
      photo: '/assets/volleyball.jpg',
    },
    {
      id: 2,
      title: 'Ballet class',
      description: 'Learn the art of ballet and prepare for an enchanting ballet performance.',
      location: 'Dance Studio 2',
      isPublic: true,
      price: 20,
      capacity: 50,
      remainingSlots: 50,
      registrationEndDate: new Date('2023-11-30T12:00:00'),
      startDate: new Date('2024-02-15T10:30:00'),
      endDate: new Date('2024-02-17T16:00:00'),
      createdAt: new Date(),
      updatedAt: new Date(),
      user: 2,
      userEmail: 'balletschool@example.com',
      categories: ['Dance', 'Performance'],
      photo: '/assets/ballet.jpg',      
    },
    {
      id: 3,
      title: 'Math Tutoring Session',
      description: 'Improve your math skills with our expert math tutoring sessions. All levels welcome!',
      location: 'Library 3',
      isPublic: false,
      capacity: 20,
      remainingSlots: 20,
      registrationEndDate: new Date('2024-01-25T14:00:00'),
      startDate: new Date('2024-03-10T17:30:00'),
      endDate: new Date('2024-03-12T19:30:00'),
      createdAt: new Date(),
      updatedAt: new Date(),
      user: 3,
      userEmail: 'mathtutors@example.com',
      categories: ['Education', 'Tutoring'],
      photo: '/assets/math.jpg',
    }
  ];
  filters: EventsFilter = {
    titlePattern: null,
    categories: null,
    accessibility: "All",
    startDate: new Date,
    endDate: null
  };

  constructor(private http: HttpClient, private accountService: AccountService) {
  }

  async listEvents(): Promise<Event[]> {
    let params = new HttpParams();
    if (this.filters.titlePattern) {
      params = params.set('title', this.filters.titlePattern);
    }
    if (this.filters.categories) {
      const categoriesString = this.filters.categories.join(',');
      params = params.set('categories', categoriesString);
    }
    if (this.filters.accessibility) {
      if(this.filters.accessibility === 'Public') {
        params = params.set('is_public', "True");
      }
      else if(this.filters.accessibility === 'Private') {
        params = params.set('is_public', "False");
      }
    }
    if (this.filters.titlePattern) {
      params = params.set('title', this.filters.titlePattern);
    }
    if (this.filters.titlePattern) {
      params = params.set('title', this.filters.titlePattern);
    }
    const events = await firstValueFrom(
      this.http.get<Event[]>('http://127.0.0.1:8000/api/events/', {params}).pipe()
    ); 
    this.events = events; 
    console.log("Events size: ", events.length);
    return this.events;
  }

  async listMyEvents(role: number): Promise<Event[]> {
    if (role === 1) {
      // as participant
      const options = {
        withCredentials: true,
      };
      const events = await firstValueFrom(
        this.http.get<EventRegistration[]>('http://127.0.0.1:8000/api/event-registrations/', options).pipe(
          map(data => data.map(item => item.eventDetail))
        )
      ); 
      console.log("My events (participant) size: ", events.length);
      return events;
    } else if (role === 2) {
      // as organiser
      const userId = this.accountService.getUserId();
      let params = new HttpParams();
      params = params.set('user', userId);
      const events = await firstValueFrom(
        this.http.get<Event[]>('http://127.0.0.1:8000/api/events/', {params}).pipe()
      ); 
      console.log("My events (organiser) size: ", events.length);
      return events;
    }
    return this.events;
  }

  async getCategories(): Promise<string[]> {
    const categories = await firstValueFrom(
      this.http.get<Category[]>('http://127.0.0.1:8000/api/categories/').pipe(
        map(data => data.map(item => item.name))
      )
    );
    this.categories = categories;
    console.log("Categories size: ", this.categories.length);
    return this.categories;
  }

  async getEventById(eventId: number): Promise<Event> {
    console.log("Getting event of id=" + eventId);
    let params = new HttpParams();
    params = params.set('id', eventId);
    const event = await firstValueFrom(
      this.http.get<Event[]>('http://127.0.0.1:8000/api/events/', {params}).pipe()
    ); 
    console.log("Event ", eventId, " data: ", event);
    return event[0];
  }

  async addEvent(event: Event): Promise<number> {
    const options = {
      withCredentials: true,
    };
    const eventResp = await firstValueFrom(
      this.http.post<Event>('http://127.0.0.1:8000/api/events/', event, options).pipe()
    );
    console.log("Added event: " + eventResp);
    const eventId = eventResp.id;
    return eventId;
  }

  async editEvent(eventId: number, updatedEvent: any) {
    const options = {
      withCredentials: true,
    };
    const eventResp = await firstValueFrom(
      this.http.post<Event>('http://127.0.0.1:8000/api/events/${eventId}', updatedEvent, options).pipe()
    );
    console.log("Updated event " + eventId + ". New value: ", eventResp);
  }

  async deleteEvent(eventId: number) {
    const options = {
      withCredentials: true,
    };
    await firstValueFrom(
      this.http.delete('http://127.0.0.1:8000/api/events/${eventId}', options).pipe()
    );
    console.log("Deleted event " + eventId);
  
  }

  isSignedUp(eventId: number): boolean {
    return false;
  }

  isOrganiser(eventId: number): boolean {
    return true;
  }

  signUp(eventId: number): void {
    
  }
  
  signOut(eventId: number): void {
    
  }
}
