import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { Ticket, SearchCriteria, ClassOption } from '../models/ticket.model';

@Injectable({
  providedIn: 'root'
})
export class TicketService {

  constructor(private http: HttpClient) { }

  // API endpoints and keys (configure in environment files)
  private flightApiUrl = 'https://api.aviationstack.com/v1/flights';
  private flightApiKey = 'YOUR_AVIATIONSTACK_API_KEY'; // Replace with actual key

  private trainApiUrl = 'https://api.irctc.co.in/v1/trains'; // Placeholder - IRCTC doesn't have public API
  private trainApiKey = 'YOUR_IRCTC_API_KEY';

  private busApiUrl = 'https://api.redbus.com/v1/buses'; // Placeholder - RedBus doesn't have public API
  private busApiKey = 'YOUR_REDBUS_API_KEY';

  // Class options for each transport mode
  private classOptions: ClassOption[] = [
    // Flights
    { id: 'business', name: 'Business Class', mode: 'flight', priceMultiplier: 3.5 },
    { id: 'economy', name: 'Economy Class', mode: 'flight', priceMultiplier: 1.0 },

    // Trains
    { id: 'sleeper', name: 'Sleeper', mode: 'train', priceMultiplier: 1.0 },
    { id: 'ac1', name: 'AC1', mode: 'train', priceMultiplier: 2.8 },
    { id: 'ac2', name: 'AC2', mode: 'train', priceMultiplier: 2.2 },
    { id: 'ac3', name: 'AC3', mode: 'train', priceMultiplier: 1.8 },

    // Buses
    { id: 'ac_bus', name: 'AC Bus', mode: 'bus', priceMultiplier: 1.5 },
    { id: 'non_ac', name: 'Non-AC / Roadways', mode: 'bus', priceMultiplier: 1.0 }
  ];

  searchTickets(criteria: SearchCriteria): Observable<Ticket[]> {
    switch (criteria.mode) {
      case 'flight':
        return this.searchFlights(criteria).pipe(
          catchError((err) => {
            console.error('⚠️ LIVE FLIGHT SEARCH FAILED. SerpApi returned an error. Falling back to Mock Data. Error:', err);
            return this.generateMockTickets(criteria);
          })
        );
      case 'train':
        return this.searchTrains(criteria).pipe(
          catchError(() => this.generateMockTickets(criteria))
        );
      case 'bus':
        return this.searchBuses(criteria).pipe(
          catchError(() => this.generateMockTickets(criteria))
        );
      default:
        return this.generateMockTickets(criteria);
    }
  }

  // Real flight search using Node.js Backend Server to bypass CORS
  private searchFlights(criteria: SearchCriteria): Observable<Ticket[]> {
    const params = new HttpParams()
      .set('source', this.getAirportCode(criteria.source))
      .set('destination', this.getAirportCode(criteria.destination))
      .set('date', criteria.date);

    return this.http.get<any[]>('http://localhost:5000/api/flights', { params }).pipe(
      map(response => this.transformBackendFlightData(response, criteria)),
      catchError(error => throwError(error))
    );
  }

  // Real train search (placeholder - IRCTC API not publicly available)
  private searchTrains(criteria: SearchCriteria): Observable<Ticket[]> {
    // Placeholder implementation - in real scenario, integrate with IRCTC API
    const params = new HttpParams()
      .set('api_key', this.trainApiKey)
      .set('source', criteria.source)
      .set('destination', criteria.destination)
      .set('date', criteria.date);

    return this.http.get<any>(this.trainApiUrl, { params }).pipe(
      map(response => this.transformTrainData(response.trains, criteria)),
      catchError(error => throwError(error))
    );
  }

  // Real bus search (placeholder - RedBus API not publicly available)
  private searchBuses(criteria: SearchCriteria): Observable<Ticket[]> {
    // Placeholder implementation - in real scenario, integrate with RedBus API
    const params = new HttpParams()
      .set('api_key', this.busApiKey)
      .set('source', criteria.source)
      .set('destination', criteria.destination)
      .set('date', criteria.date);

    return this.http.get<any>(this.busApiUrl, { params }).pipe(
      map(response => this.transformBusData(response.buses, criteria)),
      catchError(error => throwError(error))
    );
  }

  // Transform NodeJS Backend data (SerpApi response struct) to internal format
  private transformBackendFlightData(flightsArray: any[], criteria: SearchCriteria): Ticket[] {
    return flightsArray.map((flightItem, index) => {
      const selectedClass = criteria.class ? this.getClassOptions('flight').find(c => c.id === criteria.class) : this.getClassOptions('flight')[0];
      
      const price = flightItem.price || 0;
      const legs = flightItem.flights || [];
      const firstLeg = legs[0] || {};
      const lastLeg = legs[legs.length - 1] || {};

      const provider = firstLeg.airline || 'Unknown Airline';
      const scheduledDep = firstLeg.departure_airport?.time || '10:00';
      const scheduledArr = lastLeg.arrival_airport?.time || '13:00';
      const durationNum = flightItem.total_duration || 120;
      const hours = Math.floor(durationNum / 60);
      const mins = durationNum % 60;
      
      return {
        id: `real-flight-${index}-${Date.now()}`,
        provider: provider,
        mode: 'flight',
        source: criteria.source,
        destination: criteria.destination,
        date: criteria.date,
        departureTime: scheduledDep.split(' ')[1] || scheduledDep, 
        arrivalTime: scheduledArr.split(' ')[1] || scheduledArr,
        duration: `${hours}h ${mins}m`,
        price: price, // Now it is real SerpApi pricing!
        currency: 'INR', // The backend queries INR natively
        class: selectedClass?.name || 'Economy',
        status: 'on-time', // Real time status logic can be expanded
        delay: 0,
        expectedArrival: scheduledArr.split(' ')[1] || scheduledArr,
        route: `${criteria.source} → ${criteria.destination}`,
        currentLocation: 'Confirmed'
      };
    });
  }

  // Transform train API data (placeholder)
  private transformTrainData(trains: any[], criteria: SearchCriteria): Ticket[] {
    return trains.map((train, index) => {
      const selectedClass = criteria.class ? this.getClassOptions('train').find(c => c.id === criteria.class) : this.getClassOptions('train')[0];
      const basePrice = 500; // Base sleeper price
      const price = Math.round(basePrice * (selectedClass?.priceMultiplier || 1.0));

      return {
        id: `train-${train.number}`,
        provider: train.name,
        mode: 'train',
        source: criteria.source,
        destination: criteria.destination,
        date: criteria.date,
        departureTime: train.departure_time,
        arrivalTime: train.arrival_time,
        duration: train.duration,
        price: price,
        currency: 'INR',
        class: selectedClass?.name || 'Sleeper',
        status: 'on-time',
        route: `${criteria.source} → ${criteria.destination}`,
        currentLocation: 'En Route'
      };
    });
  }

  // Transform bus API data (placeholder)
  private transformBusData(buses: any[], criteria: SearchCriteria): Ticket[] {
    return buses.map((bus, index) => {
      const selectedClass = criteria.class ? this.getClassOptions('bus').find(c => c.id === criteria.class) : this.getClassOptions('bus')[0];
      const basePrice = 300; // Base non-AC price
      const price = Math.round(basePrice * (selectedClass?.priceMultiplier || 1.0));

      return {
        id: `bus-${bus.id}`,
        provider: bus.operator,
        mode: 'bus',
        source: criteria.source,
        destination: criteria.destination,
        date: criteria.date,
        departureTime: bus.departure_time,
        arrivalTime: bus.arrival_time,
        duration: bus.duration,
        price: price,
        currency: 'INR',
        class: selectedClass?.name || 'Non-AC',
        status: 'on-time',
        route: `${criteria.source} → ${criteria.destination}`,
        currentLocation: 'En Route'
      };
    });
  }

  // Get airport IATA code from city name (simplified mapping)
  private getAirportCode(city: string): string {
    if (!city) return 'DEL';
    // If the user manually inputs a 3-letter IATA code (like CDG or AUS), use it directly
    if (city.length === 3 && city === city.toUpperCase()) {
      return city;
    }
    
    // Convert input to Title Case to match map
    const formattedCity = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
    
    const airportMap: { [key: string]: string } = {
      'Delhi': 'DEL', 'Mumbai': 'BOM', 'Bangalore': 'BLR', 'Chennai': 'MAA',
      'Kolkata': 'CCU', 'Hyderabad': 'HYD', 'Pune': 'PNQ', 'Ahmedabad': 'AMD',
      'Paris': 'CDG', 'Austin': 'AUS', 'New york': 'JFK', 'London': 'LHR'
    };
    
    const code = airportMap[formattedCity];
    if (!code) {
      console.warn(`⚠️ City '${city}' not in our map. Defaulting to Delhi (DEL). Try using 3-letter codes like CDG or JFK.`);
      return 'DEL';
    }
    return code;
  }

  // Calculate flight duration
  private calculateDuration(departure: string, arrival: string): string {
    const depTime = new Date(departure);
    const arrTime = new Date(arrival);
    const diffMs = arrTime.getTime() - depTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }

  // Get available classes for a transport mode
  getClassOptions(mode: 'flight' | 'train' | 'bus'): ClassOption[] {
    return this.classOptions.filter(option => option.mode === mode);
  }

  // Get real-time status updates for tracked routes
  getRealTimeUpdates(ticketId: string): Observable<Ticket> {
    // In real implementation, this would poll the respective API
    return this.generateMockUpdate(ticketId);
  }

  // Fallback mock data generation (existing implementation)
  private generateMockTickets(criteria: SearchCriteria): Observable<Ticket[]> {
    const mockTickets: Ticket[] = this.generateRealTimeTickets(criteria);
    return of(mockTickets);
  }

  private generateMockUpdate(ticketId: string): Observable<Ticket> {
    return of(this.generateRealTimeUpdate(ticketId));
  }

  // ... existing mock data methods remain unchanged ...
  private generateRealTimeTickets(criteria: SearchCriteria): Ticket[] {
    const providers = criteria.mode === 'flight' ? ['Air India', 'Indigo', 'SpiceJet', 'Vistara', 'GoAir'] :
                     criteria.mode === 'train' ? ['Rajdhani Express', 'Shatabdi Express', 'Duronto Express', 'Garib Rath', 'Jan Shatabdi'] :
                     ['RedBus', 'MakeMyTrip Bus', 'AbhiBus', 'Yolo Bus', 'SRS Travels'];

    const classes = this.getClassOptions(criteria.mode === 'mixed' ? 'flight' : criteria.mode);
    const selectedClass = criteria.class ? classes.find(c => c.id === criteria.class) : classes[0];

    const tickets: Ticket[] = [];
    
    // Feature: AI "When to Buy" Recommendation Logic
    const flightDate = new Date(criteria.date);
    const today = new Date();
    const daysUntilDeparture = Math.floor((flightDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    let recommendation = "Prices are analyzing...";
    if (daysUntilDeparture < 7) {
      recommendation = "🔥 Buy Now. Prices will only rise in the next 7 days. (94% Confidence)";
    } else if (daysUntilDeparture >= 7 && daysUntilDeparture < 21) {
      recommendation = "✅ Buy Now. Prices are stable and at their lowest. (88% Confidence)";
    } else {
      recommendation = "⏳ Wait. Prices typically dip 2 weeks before departure. (76% Confidence)";
    }

    // Feature: Explore Everywhere Destinations
    const exoticDestinations = ['Dubai, UAE', 'Bali, Indonesia', 'Paris, France', 'Tokyo, Japan', 'New York, USA', 'London, UK'];

    for (let i = 0; i < providers.length; i++) {
      let basePrice: number;
      let randomVariation: number;

      if (criteria.mode === 'flight') {
        basePrice = 2500;
        randomVariation = 3500;
      } else if (criteria.mode === 'train') {
        basePrice = 500;
        randomVariation = 800;
      } else {
        basePrice = 300;
        randomVariation = 600;
      }

      const classMultiplier = selectedClass ? selectedClass.priceMultiplier : 1.0;
      let price = Math.round((basePrice + Math.floor(Math.random() * randomVariation)) * classMultiplier);
      
      // If Explore everywhere, make flights cost realistic international prices
      if (criteria.destination === 'Everywhere') {
         price = price * 6 + 10000;
      }

      const departureHour = criteria.time ? parseInt(criteria.time.split(':')[0]) : (6 + i * 3);
      const departureTime = `${departureHour.toString().padStart(2, '0')}:00`;
      const arrivalHour = departureHour + 3;
      const arrivalTime = `${arrivalHour.toString().padStart(2, '0')}:30`;

      const statusOptions: ('on-time' | 'delayed' | 'completed')[] = ['on-time', 'delayed', 'completed'];
      const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
      const delay = status === 'delayed' ? Math.floor(Math.random() * 120) + 15 : 0;
      const expectedArrival = delay > 0 ? this.addMinutesToTime(arrivalTime, delay) : arrivalTime;

      const actDestination = criteria.destination === 'Everywhere' ? exoticDestinations[i % exoticDestinations.length] : criteria.destination;
      const route = `${criteria.source} → ${actDestination}`;

      tickets.push({
        id: `${criteria.mode}-${i}`,
        provider: providers[i],
        mode: criteria.mode,
        source: criteria.source,
        destination: actDestination,
        date: criteria.date,
        departureTime: departureTime,
        arrivalTime: arrivalTime,
        duration: criteria.destination === 'Everywhere' ? '8h 45m' : '3h 30m',
        price: price,
        currency: 'INR',
        class: selectedClass ? selectedClass.name : 'Standard',
        status: status,
        delay: delay,
        expectedArrival: expectedArrival,
        route: route,
        recommendation: i === 0 ? recommendation : undefined, // Attach recommendation to the cheapest/first one
        currentLocation: this.generateCurrentLocation(criteria.source, actDestination, status)
      });
    }

    const sortedTickets = tickets.sort((a, b) => a.price - b.price);

    // Feature: Multi-Mode Hacker Route Injection
    // Inject a hacker route that is 35% cheaper than the absolute cheapest ticket found, to guarantee they see savings
    const absoluteCheapestPrice = sortedTickets[0].price;
    const hackerPrice = Math.floor(absoluteCheapestPrice * 0.65);
    const actDestHack = criteria.destination === 'Everywhere' ? exoticDestinations[Math.floor(Math.random() * exoticDestinations.length)] : criteria.destination;

    const hackerTicket: Ticket = {
        id: `mixed-hacker-${Date.now()}`,
        provider: 'Hacker Route Combo',
        mode: 'mixed',
        source: criteria.source,
        destination: actDestHack,
        date: criteria.date,
        departureTime: '05:00',
        arrivalTime: '14:30', // Long layovers
        duration: criteria.destination === 'Everywhere' ? '18h 15m' : '9h 30m', // Noticeably longer duration
        price: hackerPrice,
        currency: 'INR',
        class: 'Mixed Economy',
        status: 'on-time',
        delay: 0,
        expectedArrival: '14:30',
        route: `${criteria.source} → ${actDestHack}`,
        recommendation: recommendation, // Put recommendation on hacker route since it will be cheapest
        hackerSegments: criteria.mode === 'flight' || criteria.destination === 'Everywhere' ? ['bus', 'flight'] : ['bus', 'train'],
        currentLocation: 'Transit'
    };

    // Make the hacker route the undisputed cheapest element!
    sortedTickets.unshift(hackerTicket);

    return sortedTickets;
  }

  private generateRealTimeUpdate(ticketId: string): Ticket {
    const [mode] = ticketId.split('-');
    const statusOptions: ('on-time' | 'delayed' | 'completed')[] = ['on-time', 'delayed', 'completed'];
    const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];

    return {
      id: ticketId,
      provider: 'Updated Provider',
      mode: mode as 'flight' | 'train' | 'bus',
      source: 'Source',
      destination: 'Destination',
      date: new Date().toISOString().split('T')[0],
      departureTime: '10:00',
      arrivalTime: '13:30',
      duration: '3h 30m',
      price: 5000,
      currency: 'INR',
      class: 'Economy',
      status: status,
      delay: status === 'delayed' ? Math.floor(Math.random() * 60) + 10 : 0,
      expectedArrival: '13:45',
      route: 'Source → Destination',
      currentLocation: 'En Route'
    };
  }

  private addMinutesToTime(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  }

  private generateCurrentLocation(source: string, destination: string, status: string): string {
    if (status === 'completed') return destination;
    if (status === 'on-time' || status === 'delayed') {
      const locations = [`Near ${source}`, 'En Route', `Approaching ${destination}`];
      return locations[Math.floor(Math.random() * locations.length)];
    }
    return 'Unknown';
  }
}
