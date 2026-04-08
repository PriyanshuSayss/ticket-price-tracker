import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { SearchFormComponent } from './components/search-form/search-form.component';
import { ResultsComponent } from './components/results/results.component';
import { TrackingComponent } from './components/tracking/tracking.component';
import { TicketService } from './services/ticket.service';
import { LocalStorageService } from './services/local-storage.service';
import { Ticket, SearchCriteria, TrackedRoute } from './models/ticket.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatToolbarModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    SearchFormComponent,
    ResultsComponent,
    TrackingComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'Ticket Price Tracker';
  selectedTab = 0;
  searchResults: Ticket[] = [];
  currentSearchCriteria: SearchCriteria | null = null;
  isLoading = false;
  errorMessage = '';

  constructor(
    private ticketService: TicketService,
    private localStorageService: LocalStorageService
  ) {}

  ngOnInit() {
    // Initialize any startup logic here
  }

  /**
   * Handles search form submission
   * @param criteria The search criteria from the form
   */
  async onSearch(criteria: SearchCriteria) {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      this.searchResults = [];

      // Simulate network delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));

      this.ticketService.searchTickets(criteria).subscribe({
        next: (results) => {
          this.searchResults = results;
          this.currentSearchCriteria = criteria;
          this.selectedTab = 1; // Switch to results tab
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Search failed:', error);
          this.errorMessage = 'Failed to search tickets. Please try again.';
          this.isLoading = false;
        }
      });
    } catch (error) {
      console.error('Search error:', error);
      this.errorMessage = 'An unexpected error occurred. Please try again.';
      this.isLoading = false;
    }
  }

  /**
   * Handles route tracking
   * @param route The route to track
   */
  onTrackRoute(route: TrackedRoute) {
    try {
      this.localStorageService.saveTrackedRoute(route);
      this.selectedTab = 2; // Switch to tracking tab
      // Could add success notification here
    } catch (error) {
      console.error('Failed to track route:', error);
      this.errorMessage = 'Failed to track route. Please try again.';
    }
  }

  /**
   * Clears any error messages
   */
  clearError() {
    this.errorMessage = '';
  }
}
