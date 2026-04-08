import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Ticket, TrackedRoute } from '../../models/ticket.model';
import { LocalStorageService } from '../../services/local-storage.service';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './results.component.html',
  styleUrl: './results.component.css'
})
export class ResultsComponent {
  @Input() tickets: Ticket[] = [];
  @Input() searchCriteria: any;
  @Output() trackRoute = new EventEmitter<TrackedRoute>();

  isTracking = false;

  constructor(
    private localStorageService: LocalStorageService,
    private snackBar: MatSnackBar
  ) {}

  onTrackTicket(ticket: Ticket) {
    this.isTracking = true;
    const trackedRoute: TrackedRoute = {
      id: `${ticket.mode}-${ticket.source}-${ticket.destination}-${Date.now()}`,
      criteria: {
        source: ticket.source,
        destination: ticket.destination,
        date: ticket.date,
        mode: ticket.mode
      },
      lastPrice: ticket.price,
      priceHistory: [{ date: new Date().toISOString(), price: ticket.price }],
      isTracking: true,
      lastUpdated: new Date().toISOString()
    };

    this.localStorageService.saveTrackedRoute(trackedRoute);
    this.trackRoute.emit(trackedRoute);
    this.snackBar.open('Route added to tracking!', 'Close', { duration: 3000 });
    this.isTracking = false;
  }

  getCheapestTicket(): Ticket | null {
    return this.tickets.length > 0 ? this.tickets[0] : null;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'on-time':
        return 'bg-[#33D17A]/10 text-[#33D17A] border border-[#33D17A]/20';
      case 'delayed':
        return 'bg-[#FF9F43]/10 text-[#FF9F43] border border-[#FF9F43]/20';
      case 'completed':
        return 'bg-[#7A88F7]/10 text-[#7A88F7] border border-[#7A88F7]/20';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  }
}
