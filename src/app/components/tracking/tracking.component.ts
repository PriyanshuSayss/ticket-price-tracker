import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { TrackedRoute } from '../../models/ticket.model';
import { LocalStorageService } from '../../services/local-storage.service';
import { TicketService } from '../../services/ticket.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tracking',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    NgChartsModule,
    FormsModule
  ],
  templateUrl: './tracking.component.html',
  styleUrls: ['./tracking.component.css'],
  host: { class: 'block w-full' }
})
export class TrackingComponent implements OnInit, OnDestroy {
  trackedRoutes: TrackedRoute[] = [];
  private intervalId: any;

  constructor(
    private localStorageService: LocalStorageService,
    private ticketService: TicketService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadTrackedRoutes();
    this.startPricePolling();
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  loadTrackedRoutes() {
    this.trackedRoutes = this.localStorageService.getTrackedRoutes();
  }

  startPricePolling() {
    // Poll every 3 seconds for price updates to simulate live real-time trading
    this.intervalId = setInterval(() => {
      this.updatePrices();
    }, 3000);
  }

  updatePrices() {
    let hasChanges = false;
    this.trackedRoutes.forEach(route => {
      if (route.isTracking) {
        // Simulate real-time stock-like drift (-2% to +2% change)
        const volatility = 0.02; // max 2% swing
        const driftMultiplier = 1 + (Math.random() * volatility * 2) - volatility;
        
        // Round to nearest integer and ensure it doesn't drop below a base threshold
        const newPrice = Math.max(Math.round(route.lastPrice * driftMultiplier), 500);

        if (newPrice !== route.lastPrice) {
          const priceChange = newPrice - route.lastPrice;
          
          // Update the history array (keep max 20 points for clean UI)
          const newHistory = [...route.priceHistory, { date: new Date().toISOString(), price: newPrice }];
          if (newHistory.length > 20) {
             newHistory.shift();
          }

          route.priceHistory = newHistory;
          route.lastPrice = newPrice;
          this.localStorageService.saveTrackedRoute(route);
          hasChanges = true;

          // Alert only on massive drops (e.g., > 10% drop randomly generated) -> actually they drop subtly now, so let's only alert on > 5% drops
          if (priceChange < -(route.lastPrice * 0.05)) {
            this.snackBar.open(
              `Big Drop! ${route.criteria.source} to ${route.criteria.destination}: Drops to ₹${newPrice}`,
              'Book Now',
              { duration: 4000 }
            );
          }
        }
      }
    });

    if (hasChanges) {
      // Re-bind array to trigger UI change detection if necessary
      this.trackedRoutes = [...this.trackedRoutes];
    }
  }

  stopTracking(routeId: string) {
    const route = this.trackedRoutes.find(r => r.id === routeId);
    if (route) {
      route.isTracking = false;
      this.localStorageService.saveTrackedRoute(route);
      this.snackBar.open('Tracking stopped', 'Close', { duration: 3000 });
    }
  }

  removeRoute(routeId: string) {
    this.localStorageService.removeTrackedRoute(routeId);
    this.loadTrackedRoutes();
    this.snackBar.open('Route removed', 'Close', { duration: 3000 });
  }

  // Feature: Push Notification Alerts Form State
  alertFormOpen: { [routeId: string]: boolean } = {};
  phoneInput: { [routeId: string]: string } = {};

  toggleAlertForm(routeId: string) {
    this.alertFormOpen[routeId] = !this.alertFormOpen[routeId];
  }

  saveAlertSettings(route: TrackedRoute) {
    if (this.phoneInput[route.id] && this.phoneInput[route.id].length > 5) {
      route.alertsActive = true;
      route.contactMethod = this.phoneInput[route.id];
      this.localStorageService.saveTrackedRoute(route);
      this.alertFormOpen[route.id] = false;
      this.snackBar.open(`Alerts activated for ${route.contactMethod}!`, 'Awesome', { duration: 4000 });
    } else {
      this.snackBar.open('Please enter a valid phone number or email', 'Close', { duration: 3000 });
    }
  }

  disableAlerts(route: TrackedRoute) {
     route.alertsActive = false;
     route.contactMethod = undefined;
     this.localStorageService.saveTrackedRoute(route);
     this.snackBar.open('Alerts disabled', 'Close', { duration: 3000 });
  }

  /**
   * Generates chart data for price history visualization
   * @param route The tracked route to generate chart data for
   * @returns Chart configuration data
   */
  getChartData(route: TrackedRoute): ChartConfiguration['data'] {
    return {
      datasets: [{
        data: route.priceHistory.map(p => p.price),
        label: 'Price History (₹)',
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }],
      labels: route.priceHistory.map(p => new Date(p.date).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric'
      }))
    };
  }

  /**
   * Chart configuration options for responsive design
   */
  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: 500
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context) => `₹${(context.parsed.y ?? 0).toLocaleString('en-IN')}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          callback: (value) => `₹${value.toLocaleString('en-IN')}`,
          font: {
            size: 11
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    elements: {
      point: {
        hoverBorderWidth: 3
      }
    }
  };

  chartType: ChartType = 'line';

  /**
   * TrackBy function for ngFor optimization
   * @param index The index of the item
   * @param route The tracked route
   * @returns The route ID for tracking
   */
  trackByRouteId(index: number, route: TrackedRoute): string {
    return route.id;
  }

  /**
   * Returns the appropriate icon for the travel mode
   * @param mode The travel mode
   * @returns The icon name
   */
  getModeIcon(mode: string): string {
    switch (mode) {
      case 'flight': return 'flight';
      case 'train': return 'train';
      case 'bus': return 'directions_bus';
      default: return 'travel_explore';
    }
  }

  /**
   * Calculates the raw price difference between the latest and the previous price
   */
  getPriceDifference(route: TrackedRoute): number {
    if (route.priceHistory.length < 2) return 0;
    const latest = route.priceHistory[route.priceHistory.length - 1].price;
    const previous = route.priceHistory[route.priceHistory.length - 2].price;
    return latest - previous;
  }

  /**
   * Calculates the percentage difference
   */
  getPriceDifferencePercent(route: TrackedRoute): number {
    if (route.priceHistory.length < 2) return 0;
    const previous = route.priceHistory[route.priceHistory.length - 2].price;
    if (previous === 0) return 0;
    const diff = this.getPriceDifference(route);
    return (diff / previous) * 100;
  }

  /**
   * Returns trend status
   */
  getTrendSegment(route: TrackedRoute): 'up' | 'down' | 'flat' {
    const diff = this.getPriceDifference(route);
    if (diff > 0) return 'up';
    if (diff < 0) return 'down';
    return 'flat';
  }

  getDiffValueStr(route: TrackedRoute): string {
    return Math.abs(this.getPriceDifference(route)).toLocaleString('en-IN');
  }

  getDiffPctStr(route: TrackedRoute): string {
    return Math.abs(this.getPriceDifferencePercent(route)).toFixed(1);
  }
}
