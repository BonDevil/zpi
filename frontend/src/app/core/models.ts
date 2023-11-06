  export interface Category {
    name: string,
    id: number
  }

  export interface EventRegistration {
    id: number;
    event: number;
    eventDetail: Event;
    isRegistered: boolean;
    userEmail: string;
    registrationDate: Date;
    updatedAt: Date;
  }
  
  export interface Event {
    id: number;
    title: string;
    description: string;
    location: string;
    isPublic: boolean;
    price?: number;
    capacity?: number;
    remainingSlots?: number;
    registrationEndDate?: Date;
    startDate?: Date;
    endDate?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    user: number;
    userEmail: string;
    categories?: string[];
    photo: string;
  }
  
  export interface User {
    id?: number,
    username?: string;
    email: string;
    password: string;
  }

  export interface EventsFilter {
    titlePattern: string | null,
    categories: string[] | null,
    accessibility: string | null,
    startDate: Date | null,
    endDate: Date | null
  }