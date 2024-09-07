import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { CustomProperty, CustomPropertyAndValues, CustomPropertySelectValue } from '../models/custom-property';
import { Database, getManyWithCache } from './db';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class CustomPropertyService {
  constructor(private httpClient: HttpClient) {
  }

  getCustomProperties(): Observable<CustomProperty[]> {
    const request$ = this.httpClient.get<CustomProperty[]>(`http://server/api/latest/company/custom-properties`);
    return getManyWithCache(request$, Database.customProperties);
  }

  getCustomPropertyValues(id: number): Observable<CustomPropertySelectValue[]> {
    const request$ = this.httpClient.get<CustomPropertySelectValue[]>(`http://server/api/latest/company/custom-properties/${id}/select-values`);
    return getManyWithCache(request$, Database.customPropertySelectValues, t => t.where({ custom_property_id: id }));
  }

  getCustomPropertiesWithValues(): Observable<CustomPropertyAndValues[]> {
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