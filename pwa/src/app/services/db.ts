import Dexie, { Collection, Table } from 'dexie';
import { ColumnEx } from '../models/column-ex';
import { Board } from '../models/board';
import { Space } from '../models/space';
import { CustomProperty, CustomPropertySelectValue } from '../models/custom-property';
import { User } from '../models/user';
import { from, Observable, of, switchMap, tap } from 'rxjs';
import { Lane } from '../models/lane';
import { CardEx } from '../models/card-ex';
import { CardType } from '../models/card-type';

export interface EntityBase {
  created_at: Date;
}

export interface AvatarEntity extends EntityBase {
  user_id: number;
  data: Blob;
}

export interface ColumnEntity extends ColumnEx, EntityBase {
}

export interface BoardEntity extends Board, EntityBase {
}

export interface SpaceEntity extends Space, EntityBase {
}

export interface CustomPropertyEntity extends CustomProperty, EntityBase {
}

export interface CustomPropertySelectValueEntity extends CustomPropertySelectValue, EntityBase {
}

export interface UserEntity extends User, EntityBase {
}

export interface LaneEntity extends Lane, EntityBase {}

export interface CardEntity extends CardEx, EntityBase { }

export interface CardTypeEntity extends CardType, EntityBase {}

export class Db extends Dexie {
  public avatars!: Table<AvatarEntity, number>;
  public columns!: Table<ColumnEntity, number>;
  public boards!: Table<BoardEntity, number>;
  public spaces!: Table<SpaceEntity, number>;
  public customProperties!: Table<CustomPropertyEntity, number>;
  public customPropertySelectValues!: Table<CustomPropertySelectValueEntity, number>;
  public users!: Table<UserEntity, number>;
  public lanes!: Table<LaneEntity, number>;
  public cardTypes!: Table<CardTypeEntity, number>;
  public cardDrafts!: Table<CardEntity, number>;

  public constructor() {
    super('torpedo');

    this.version(1).stores({
      avatars: 'user_id',
      columns: 'id, board_id',
      boards: 'id',
      spaces: 'id',
      customProperties: 'id',
      customPropertySelectValues: 'id, custom_property_id',
      users: 'id, uid',
      lanes: 'id, board_id',
      cardTypes: 'id',
      cardDrafts: 'id++'
    });
  }
}

export const Database = new Db();

export function getManyWithCache<TDto, TEntity extends EntityBase & TDto>(request$: Observable<TDto[]>, table: Table<TEntity>, whereClause: (table: Table<TEntity>) => Collection = null): Observable<TDto[]> {
  const cache = whereClause ? whereClause(table).toArray() : table.toArray();
  return from(cache)
    .pipe(
      switchMap(data => {
        const serverResult$ = request$
          .pipe(
            tap(columns => {
              const entities = columns.map(col => <TEntity>{ ...col, created_at: new Date() });
              table.bulkPut(entities);
            })
          );

        if(!data.length) {
          return serverResult$;
        }
        else if (data.some(v => v.created_at.elapsed() > 1000 * 60 /*one minute*/)) {
          serverResult$.subscribe();
          return of(data);
        }
        else {
          return of(data);
        }
      })
    );
}

export function getSingleWithCache<TDto, TEntity extends EntityBase & TDto>(request$: Observable<TDto>, table: Table<TEntity>, key: unknown): Observable<TDto> {
  return from(table.get(key))
    .pipe(
      switchMap(data => {
        const serverResult$ = request$
          .pipe(
            tap(data => {
              table.put(<TEntity>{ ...data, created_at: new Date() });
            })
          );

        if(!data) {
          return serverResult$;
        }
        else if (data.created_at.elapsed() > 1000 * 60 /*one minute*/) {
          serverResult$.subscribe();
          return of(data);
        }
        else {
          return of(data);
        }
      })
    );
}

export interface Mapper<TDto, TEntity> {
  toEntity: (dto: TDto) => TEntity;
  toDto: (dto: TEntity) => TDto;
}

export function getSingleWithCacheWithMap<TDto, TEntity extends EntityBase>(request$: Observable<TDto>, table: Table<TEntity>, key: unknown, mapper: Mapper<TDto, TEntity>, timeout: number = 1000 * 60): Observable<TDto> {
  return from(table.get(key))
    .pipe(
      switchMap(data => {
        const serverResult$ = request$
          .pipe(
            tap(data => {
              table.put(mapper.toEntity(data));
            })
          );

        if(!data) {
          return serverResult$;
        }
        else if (data.created_at.elapsed() > timeout) {
          serverResult$.subscribe();
          return of(mapper.toDto(data));
        }
        else {
          return of(mapper.toDto(data));
        }
      })
    );
}
