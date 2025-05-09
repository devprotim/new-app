import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { CashReceiptResponse } from '../models/cash-receipt.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://103.92.47.69/hitechErp/Api/Accounting/CashierAccountingCashRecieve.php';

  constructor(private http: HttpClient) { }

  getCashReceiptData(fromDate: string, toDate: string): Observable<CashReceiptResponse> {
    const payload = {
      financialYearId: 4,
      btn_name: "TRACKER",
      fromDate: fromDate,
      toDate: toDate,
      businessAreaId: "1"
    };

    return this.http.post<any>(this.apiUrl, payload).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return {
            success: true,
            data: response
          };
        } else if (response && typeof response === 'object') {
          if (!response.success && !response.data) {
            return {
              success: true,
              data: [response]
            };
          } else {
            return response;
          }
        } else {
          return {
            success: false,
            data: [],
            message: 'Invalid response '
          };
        }
      }),
      catchError(error => {
        return of({
          success: false,
          data: [],
          message: error.message || 'Network error '
        });
      })
    );
  }
}
