import { forkJoin, map, Observable, of, switchMap, tap } from 'rxjs';
import { CustomProperty, CustomPropertyAndValues, CustomPropertySelectValue } from '../models/custom-property';
import { Database, getManyWithCache } from './db';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class CustomPropertyService {
  public constructor(private httpClient: HttpClient) {
  }

  public getCustomProperties(): Observable<CustomProperty[]> {
    const request$ = this.httpClient.get<CustomProperty[]>('http://server/api/latest/company/custom-properties');
    return getManyWithCache(request$, Database.customProperties);
  }

  public getCustomPropertyValues(id: number): Observable<CustomPropertySelectValue[]> {
    const request$ = this.httpClient.get<CustomPropertySelectValue[]>(`http://server/api/latest/company/custom-properties/${id}/select-values`);
    return getManyWithCache(request$, Database.customPropertySelectValues, t => t.where({ custom_property_id: id }));
  }

  public addCustomPropertyValue(id: number, value: string): Observable<CustomPropertySelectValue> {
    const request$ = this.httpClient.post<CustomPropertySelectValue>(`http://server/api/latest/company/custom-properties/${id}/select-values`, {
      value
    })
      .pipe(
        tap(value => {
          Database.customPropertySelectValues.put({ ...value, created_at: new Date() });
        })
      );

    return request$;
  }

  public getCustomPropertiesWithValues(): Observable<CustomPropertyAndValues[]> {
    return this.getCustomProperties()
      .pipe(
        switchMap(properties => {
          const results = properties.map(property => {
            if (property.type === 'select') {
              return this.getCustomPropertyValues(property.id)
                .pipe(
                  map(values => ({ property, values } as CustomPropertyAndValues))
                );
            } else {
              return of({ property, values: null } as CustomPropertyAndValues);
            }
          });

          return results.length ? forkJoin<CustomPropertyAndValues[]>(results) : of([]);
        }),
      );
  }

}
