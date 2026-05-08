import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';

export interface Address {
  id: number;
  full_name: string;
  phone: string;
  email: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface PincodeValidationResponse {
  valid: boolean;
  pincode?: string;
  cities?: string[];
  states?: string[];
  post_offices?: Array<{
    name: string;
    city: string;
    state: string;
  }>;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AddressService {
  private baseUrl = `${environment.apiBaseUrl}/api/addresses`;
  private addressesSubject = new BehaviorSubject<Address[]>([]);
  public addresses$ = this.addressesSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getAddresses(): Observable<Address[]> {
    return this.http
      .get<{ results: Address[] }>(this.baseUrl, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        map((response) => response.results),
        tap((addresses) => {
          this.addressesSubject.next(addresses);
        }),
      );
  }

  getDefaultAddress(): Observable<Address> {
    return this.http.get<Address>(`${this.baseUrl}/default/`, {
      headers: this.getAuthHeaders(),
    });
  }

  createAddress(address: Omit<Address, 'id' | 'created_at' | 'updated_at'>): Observable<Address> {
    return this.http.post<Address>(this.baseUrl + '/', address, {
      headers: this.getAuthHeaders(),
    });
  }

  updateAddress(id: number, address: Partial<Address>): Observable<Address> {
    return this.http.put<Address>(`${this.baseUrl}/${id}/`, address, {
      headers: this.getAuthHeaders(),
    });
  }

  deleteAddress(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}/`, {
      headers: this.getAuthHeaders(),
    });
  }

  setDefaultAddress(id: number): Observable<Address> {
    return this.http.post<Address>(
      `${this.baseUrl}/set_default/`,
      { address_id: id },
      { headers: this.getAuthHeaders() },
    );
  }

  validatePincode(pincode: string): Observable<PincodeValidationResponse> {
    return this.http.get<PincodeValidationResponse>(`${this.baseUrl}/validate_pincode/`, {
      headers: this.getAuthHeaders(),
      params: { pincode },
    });
  }
}
