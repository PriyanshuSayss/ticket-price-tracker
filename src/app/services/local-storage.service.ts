import { Injectable } from '@angular/core';
import { TrackedRoute } from '../models/ticket.model';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  private readonly TRACKED_ROUTES_KEY = 'trackedRoutes';

  constructor() { }

  getTrackedRoutes(): TrackedRoute[] {
    const data = localStorage.getItem(this.TRACKED_ROUTES_KEY);
    return data ? JSON.parse(data) : [];
  }

  saveTrackedRoute(route: TrackedRoute): void {
    const routes = this.getTrackedRoutes();
    const existingIndex = routes.findIndex(r => r.id === route.id);
    if (existingIndex >= 0) {
      routes[existingIndex] = route;
    } else {
      routes.push(route);
    }
    localStorage.setItem(this.TRACKED_ROUTES_KEY, JSON.stringify(routes));
  }

  removeTrackedRoute(routeId: string): void {
    const routes = this.getTrackedRoutes().filter(r => r.id !== routeId);
    localStorage.setItem(this.TRACKED_ROUTES_KEY, JSON.stringify(routes));
  }

  updatePriceHistory(routeId: string, newPrice: number): void {
    const routes = this.getTrackedRoutes();
    const route = routes.find(r => r.id === routeId);
    if (route) {
      route.lastPrice = newPrice;
      route.priceHistory.push({ date: new Date().toISOString(), price: newPrice });
      this.saveTrackedRoute(route);
    }
  }
}
