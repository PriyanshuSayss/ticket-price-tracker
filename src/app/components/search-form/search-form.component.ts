import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { SearchCriteria, ClassOption } from '../../models/ticket.model';
import { TicketService } from '../../services/ticket.service';

@Component({
  selector: 'app-search-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule
  ],
  templateUrl: './search-form.component.html',
  styleUrl: './search-form.component.css'
})
export class SearchFormComponent implements OnInit {
  @Output() search = new EventEmitter<SearchCriteria>();

  searchForm: FormGroup;
  isLoading = false;
  isSubmitting = false;
  minDate: string;
  availableClasses: ClassOption[] = [];
  selectedMode: 'flight' | 'train' | 'bus' = 'flight';

  // Background images for each mode
  backgroundImages = {
    flight: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80',
    train: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80',
    bus: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80'
  };

  // Popular routes for quick selection
  popularRoutes: { source: string; destination: string }[] = [
    { source: 'Delhi', destination: 'Mumbai' },
    { source: 'Mumbai', destination: 'Bangalore' },
    { source: 'Delhi', destination: 'Bangalore' },
    { source: 'Mumbai', destination: 'Dubai' },
    { source: 'Delhi', destination: 'London' },
    { source: 'Paris', destination: 'New York' },
    { source: 'Singapore', destination: 'Sydney' },
    { source: 'Bangalore', destination: 'Singapore' }
  ];

  // City suggestions for autocomplete (Added International hubs)
  cities: string[] = [
    // International Hubs
    'London (LHR)', 'Paris (CDG)', 'New York (JFK)', 'Dubai (DXB)', 'Singapore (SIN)', 
    'Tokyo (HND)', 'Sydney (SYD)', 'Hong Kong (HKG)', 'Frankfurt (FRA)', 'Amsterdam (AMS)',
    'Bangkok (BKK)', 'Seoul (ICN)', 'Istanbul (IST)', 'Los Angeles (LAX)', 'San Francisco (SFO)',
    'Chicago (ORD)', 'Toronto (YYZ)', 'Vancouver (YVR)', 'Paris', 'London', 'New York', 'Dubai',
    
    // Indian Cities
    'Delhi (DEL)', 'Mumbai (BOM)', 'Bangalore (BLR)', 'Chennai (MAA)', 'Kolkata (CCU)', 'Pune (PNQ)', 'Hyderabad (HYD)', 'Ahmedabad (AMD)',
    'Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Pune', 'Hyderabad', 'Ahmedabad',
    'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal',
    'Visakhapatnam', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 
    'Varanasi', 'Srinagar', 'Amritsar', 'Ranchi', 'Coimbatore', 'Kochi', 'Guwahati', 'Chandigarh'
  ];

  // Filtered suggestions
  sourceSuggestions: string[] = [];
  destinationSuggestions: string[] = [];
  showSourceSuggestions = false;
  showDestinationSuggestions = false;

  /**
   * Filters cities based on user input for source field
   * @param event The input event
   */
  onSourceInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    if (value.length >= 2) {
      this.sourceSuggestions = this.cities.filter(city =>
        city.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 10); // Limit to 10 suggestions
      this.showSourceSuggestions = true;
    } else {
      this.showSourceSuggestions = false;
    }
  }

  /**
   * Filters cities based on user input for destination field
   * @param event The input event
   */
  onDestinationInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    if (value.length >= 2) {
      this.destinationSuggestions = this.cities.filter(city =>
        city.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 10); // Limit to 10 suggestions
      this.showDestinationSuggestions = true;
    } else {
      this.showDestinationSuggestions = false;
    }
  }

  /**
   * Selects a city from suggestions for source field
   * @param city The selected city
   */
  selectSourceCity(city: string) {
    this.searchForm.patchValue({ source: city });
    this.showSourceSuggestions = false;
  }

  /**
   * Selects a city from suggestions for destination field
   * @param city The selected city
   */
  selectDestinationCity(city: string) {
    this.searchForm.patchValue({ destination: city });
    this.showDestinationSuggestions = false;
  }

  /**
   * Hides suggestions when clicking outside
   */
  hideSuggestions() {
    this.showSourceSuggestions = false;
    this.showDestinationSuggestions = false;
  }

  constructor(private fb: FormBuilder, private ticketService: TicketService) {
    // Set minimum date to today
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];

    this.searchForm = this.fb.group({
      source: ['', [Validators.required, Validators.minLength(2)]],
      destination: ['', [Validators.required, Validators.minLength(2)]],
      date: ['', Validators.required],
      mode: ['flight', Validators.required],
      class: ['']
    });

    // Update available classes when mode changes
    this.searchForm.get('mode')?.valueChanges.subscribe(mode => {
      this.selectedMode = mode;
      this.availableClasses = this.ticketService.getClassOptions(mode);
      // Reset class selection when mode changes
      this.searchForm.patchValue({ class: '' });
    });
  }

  ngOnInit() {
    // Set default date to tomorrow for better UX
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.searchForm.patchValue({
      date: tomorrow.toISOString().split('T')[0]
    });
  }

  /**
   * Handles form submission with loading states
   */
  async onSearch() {
    if (this.searchForm.valid) {
      this.isSubmitting = true;

      try {
        // Add slight delay for better UX feedback
        await new Promise(resolve => setTimeout(resolve, 300));

        const criteria: SearchCriteria = {
          ...this.searchForm.value,
          date: this.formatDateForAPI(this.searchForm.value.date)
        };

        this.search.emit(criteria);
      } catch (error) {
        console.error('Search submission error:', error);
      } finally {
        this.isSubmitting = false;
      }
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.searchForm.controls).forEach(key => {
        this.searchForm.get(key)?.markAsTouched();
      });
    }
  }

  /**
   * Sets a popular route in the form
   * @param route The popular route to set
   */
  setPopularRoute(route: { source: string; destination: string }) {
    this.searchForm.patchValue({
      source: route.source,
      destination: route.destination
    });
  }

  /**
   * Formats date string for API consumption
   * @param dateString The date string from form
   * @returns Formatted date string
   */
  private formatDateForAPI(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  /**
   * Quick action to set destination to 'Everywhere'
   */
  exploreEverywhere() {
    this.searchForm.patchValue({ destination: 'Everywhere' });
  }

  /**
   * Checks if source and destination are different
   */
  get isSameSourceDestination(): boolean {
    const source = this.searchForm.get('source')?.value;
    const destination = this.searchForm.get('destination')?.value;
    if (destination === 'Everywhere') return false;
    return source && destination && source.toLowerCase() === destination.toLowerCase();
  }
}
