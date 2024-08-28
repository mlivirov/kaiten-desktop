import { Component, Injectable, Input, OnInit, ViewChild } from '@angular/core';
import {
  NgbDateAdapter,
  NgbDatepicker,
  NgbDateStruct,
  NgbInputDatepicker, NgbTooltip,
  NgbTypeahead
} from '@ng-bootstrap/ng-bootstrap';
import {
  EditorProperty, EditorPropertyTemplate,
  GroupOfEditorProperties,
  PropertiesEditorComponent
} from '../../properties-editor/properties-editor.component';
import { CardEx } from '../../../models/card-ex';
import { Column } from '../../../models/column';
import { catchError, debounceTime, EMPTY, finalize, forkJoin, Observable, of, OperatorFunction, switchMap } from 'rxjs';
import { User } from '../../../models/user';
import { Tag } from '../../../models/tag';
import { CustomProperty, CustomPropertyAndValues, CustomPropertySelectValue } from '../../../models/custom-property';
import { CardProperties } from '../../../models/card-properties';
import { StringToDateFunction } from '../../../functions/string-to-date.function';
import { Owner } from '../../../models/owner';
import { MemberType } from '../../../models/member-type';
import { UnionIfNotExistsFunction } from '../../../functions/union-if-not-exists.function';
import { ApiService } from '../../../services/api.service';
import { CardStateLabelComponent } from '../card-state-label/card-state-label.component';
import { AsyncPipe, DatePipe, NgForOf, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InlineMemberComponent } from '../../inline-member/inline-member.component';
import { FindColumnRecursiveFunction } from '../../../functions/find-column-recursive.function';
import { ColumnEx } from '../../../models/column-ex';
import { FlattenColumnsFunction } from '../../../functions/flatten-columns.function';

@Injectable()
export class NgbDateStringAdapter extends NgbDateAdapter<string> {
  fromModel(value: string | null): NgbDateStruct | null {

    if (value) {
      const date = new Date(value);
      return {
        day: date.getDate(),
        month: date.getMonth() + 1,
        year: date.getFullYear(),
      };
    }
    return null;
  }

  toModel(value: NgbDateStruct | null): string | null {
    if (!value) {
      return null;
    }

    const date = new Date(value.year, value.month - 1, value.day);
    const offsetMs = date.getTimezoneOffset() * 60 * 1000;
    const msLocal =  date.getTime() - offsetMs;
    const dateLocal = new Date(msLocal);
    const iso = dateLocal.toISOString();
    const isoLocal = iso.slice(0, 19);

    return isoLocal;
  }
}

@Component({
  selector: 'app-card-properties',
  standalone: true,
  imports: [
    CardStateLabelComponent,
    DatePipe,
    FormsModule,
    InlineMemberComponent,
    NgForOf,
    NgbInputDatepicker,
    NgbTypeahead,
    PropertiesEditorComponent,
    EditorPropertyTemplate,
    NgbDatepicker,
    NgbInputDatepicker,
    NgbTypeahead,
    AsyncPipe,
    NgbTooltip,
    NgIf,
  ],
  templateUrl: './card-properties.component.html',
  styleUrl: './card-properties.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: NgbDateStringAdapter }
  ]
})
export class CardPropertiesComponent implements OnInit {
  NumberMin = Number.MIN_VALUE;
  NumberMax = Number.MAX_VALUE;
  FindColumnRecursiveFunction = FindColumnRecursiveFunction;
  MemberType = MemberType;

  @ViewChild('propertiesEditor')
  propertiesEditor: PropertiesEditorComponent;

  @Input({ required: true })
  card: CardEx;

  cardUsersTypeaheadSearch: OperatorFunction<string, readonly User[]>
    = (text$: Observable<string>) =>
    text$
      .pipe(
        debounceTime(200),
        switchMap(term => {
          return this.apiService.getCardAllowedUsers(this.card.id, 0, 10, term);
        })
      );


  allUsersTypeaheadSearch: OperatorFunction<string, readonly User[]>
    = (text$: Observable<string>) =>
    text$
      .pipe(
        debounceTime(200),
        switchMap(term => {
          return this.apiService.getUsers(0, 10, term);
        })
      );

  userTypeaheadFormatter = (item: User) => item.full_name;

  tagTypeaheadSearch: OperatorFunction<string, readonly Tag[]>
    = (text$: Observable<string>) =>
    text$
      .pipe(
        debounceTime(200),
        switchMap(term => {
          return this.apiService.getTags(0, 10, term);
        })
      );

  tagTypeaheadFormatter = (item: Tag) => item.name;

  properties: GroupOfEditorProperties[] = [];
  columns: Column[] = [];
  isSaveInProgress: boolean = false;

  constructor(private apiService: ApiService) {
  }


  findSelectValue(values: CustomPropertySelectValue[], id: number) {
    return values.find(value => value.id === id);
  }

  findUserByUid(uid: string): Observable<User> {
    return this.apiService.getUserByUid(uid);
  }

  getCustomPropertyValue(values: CardProperties, property: CustomProperty) {
    if (!values) {
      return null;
    }
    const value = values[`id_${property.id}`];
    if (value === undefined) {
      return null;
    } else if (property.multi_select) {
      return values;
    } else if (Array.isArray(value)) {
      return value[0];
    } else {
      return value;
    }
  }

  extractProperties(customProperties: CustomPropertyAndValues[]) {
    this.properties = [];

    const globalPropertiesGroup = {
      title: 'Common',
      properties: [
        <EditorProperty>{ label: 'Sprint', value: this.card.sprint_id, multi: false, name: 'sprint', type: 'plain' },
        <EditorProperty>{ label: 'State', value: this.card.state, multi: false, name: 'state', type: 'state' },
        <EditorProperty>{ label: 'Size', value: this.card.size, multi: false, name: 'size', type: 'size' },
        <EditorProperty>{ label: 'Lane', value: this.card.lane, multi: false, name: 'lane', type: 'title' },
        <EditorProperty>{ label: 'Board', value: this.card.board, multi: false, name: 'board', type: 'title' },
        <EditorProperty>{ label: 'Column', value: this.card.column, multi: false, name: 'column', type: 'column' },
      ]
    };
    this.properties.push(globalPropertiesGroup);

    const customPropertiesGroup = <GroupOfEditorProperties>{
      title: 'Properties',
      properties: customProperties.map<EditorProperty>(property => ({
        extra: property,
        label: property.property.name,
        name: property.property.name,
        multi: false,
        value: this.getCustomPropertyValue(this.card.properties, property.property),
        type: `custom-${property.property.type}${property.property.multi_select ? '-multi' : ''}`
      }))
    };

    if (customPropertiesGroup.properties.length) {
      this.properties.push(customPropertiesGroup);
    }

    const timeManagementGroup = {
      title: 'Time management',
      properties: [
        <EditorProperty>{ label: 'Due date', value: StringToDateFunction(this.card.due_date), multi: false, name: 'due_date', type: 'date' },
      ]
    };

    if (this.card.completed_at) {
      timeManagementGroup.properties.push(<EditorProperty>{ label: 'Completed at', value: this.card.completed_at, multi: false, name: 'completed_at', type: 'date' },);
    }

    if (this.card.completed_on_time) {
      timeManagementGroup.properties.push(<EditorProperty>{ label: 'Completed on time', value: this.card.completed_on_time, multi: false, name: 'completed_on_time', type: 'bool' });
    }

    if (this.card.goals_total) {
      timeManagementGroup.properties.push(<EditorProperty>{ label: 'Goals', value: { total: this.card.goals_total, done: this.card.goals_done }, multi: false, name: 'goals', type: 'goals'});
    }

    this.properties.push(timeManagementGroup);

    const membersGroup = {
      title: 'Members',
      properties: [
        <EditorProperty>{ label: null, value: this.card.members, multi: true, name: 'members', type: 'member' },
      ]
    };

    this.properties.push(membersGroup);

    const tagsGroup = {
      title: 'Tags',
      properties: [
        <EditorProperty>{ label: null, value: this.card.tags, multi: true, name: 'tags', type: 'tag' },
      ]
    };

    this.properties.push(tagsGroup);
  }

  confirmSave(property: EditorProperty) {
    if (property.type === 'tag') {
      this.addTag(property);
    } else if (property.type === 'member') {
      this.addMember(property);
    } else if (property.type === 'custom-date') {
      this.updateCustomDate(property);
    } else if (property.type === 'custom-string') {
      this.updateCustomString(property);
    } else if (property.type === 'custom-select') {
      this.updateCustomSelect(property);
    } else if (property.type === 'custom-checkbox') {
      this.updateCustomCheckbox(property);
    } else if (property.type === 'custom-user') {
      this.updateCustomUser(property);
    } else if (property.type === 'size') {
      this.updateSize(property);
    } else if (property.type === 'column') {
      this.updateColumn(property);
    } else if (property.type === 'date') {
      this.updateDateProperty(property);
    }
  }

  updateDateProperty(property: EditorProperty<string>) {
    this.apiService.updateCard(this.card.id, {
      [property.name]: property.value
    } as unknown as CardEx)
      .pipe(
        catchError(() => {
          this.propertiesEditor.abortSave();
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.propertiesEditor.commitChanges(property.value);
      });
  }

  updateColumn(property: EditorProperty<Column>) {
    this.apiService.updateCard(this.card.id, {
      column_id: property.value.id
    })
      .pipe(
        catchError(() => {
          this.propertiesEditor.abortSave();
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.propertiesEditor.commitChanges(property.value);
      });
  }

  updateSize(property: EditorProperty<number>) {
    this.apiService.updateCard(this.card.id, {
      size: property.value
    })
      .pipe(
        catchError(() => {
          this.propertiesEditor.abortSave();
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.propertiesEditor.commitChanges(property.value);
      });
  }

  updateCustomUser(property: EditorProperty<string, CustomPropertyAndValues>) {
    this.apiService.updateCard(this.card.id, {
      properties: {
        [`id_${property.extra.property.id}`]: property.value ? [property.value] : null
      }
    })
      .pipe(
        catchError(() => {
          this.propertiesEditor.abortSave();
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.propertiesEditor.commitChanges(property.value);
      });
  }

  updateCustomCheckbox(property: EditorProperty<boolean, CustomPropertyAndValues>) {
    this.apiService.updateCard(this.card.id, {
      properties: {
        [`id_${property.extra.property.id}`]: property.value
      }
    })
      .pipe(
        catchError(() => {
          this.propertiesEditor.abortSave();
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.propertiesEditor.commitChanges(property.value);
      });
  }

  updateCustomSelect(property: EditorProperty<number, CustomPropertyAndValues>) {
    this.apiService.updateCard(this.card.id, {
      properties: {
        [`id_${property.extra.property.id}`]: [property.value]
      }
    })
      .pipe(
        catchError(() => {
          this.propertiesEditor.abortSave();
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.propertiesEditor.commitChanges(property.value);
      });
  }

  updateCustomString(property: EditorProperty<string, CustomPropertyAndValues>) {
    this.apiService.updateCard(this.card.id, {
      properties: {
        [`id_${property.extra.property.id}`]: property.value
      }
    })
      .pipe(
        catchError(() => {
          this.propertiesEditor.abortSave();
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.propertiesEditor.commitChanges(property.value);
      });
  }

  updateCustomDate(property: EditorProperty<{ date: string}, CustomPropertyAndValues>) {
    let newValue = null;
    const date = StringToDateFunction(property.value.date);
    if (date) {
      newValue = {
        date: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
        time: null,
        tzOffset: null
      }
    }

    this.apiService.updateCard(this.card.id, {
      properties: {
        [`id_${property.extra.property.id}`]: newValue
      }
    })
      .pipe(
        catchError(() => {
          this.propertiesEditor.abortSave();
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.propertiesEditor.commitChanges(newValue);
      });
  }

  makeMemberResponsible(member: Owner) {
    this.isSaveInProgress = true;
    this.apiService
      .makeMemberResponsible(this.card.id, member.id)
      .pipe(
        finalize(() => this.isSaveInProgress = false),
      )
      .subscribe(() => {
        member.type = MemberType.Responsible;
      });
  }

  addMember(property: EditorProperty<User>) {
    this.apiService
      .addMemberToCard(this.card.id, property.value.id)
      .pipe(
        catchError(() => {
          this.propertiesEditor.abortSave();
          return EMPTY;
        })
      )
      .subscribe(member => {
        this.card.members = UnionIfNotExistsFunction(this.card.members, member, 'id');
        this.propertiesEditor.commitChanges(this.card.members);
      })
  }

  removeMember(member: User, property: EditorProperty<User[]>) {
    this.isSaveInProgress = true;
    this.apiService
      .removeMemberFromCard(this.card.id, member.id)
      .pipe(
        finalize(() => this.isSaveInProgress = false)
      )
      .subscribe(() => {
        const indexOfElement = this.card.members.indexOf(member);
        this.card.members.splice(indexOfElement, 1);
      });
  }

  addTag(property: EditorProperty) {
    const name = typeof property.value === 'string' ? property.value : property.value.name;
    this.apiService
      .createTag(this.card.id, name)
      .pipe(
        catchError(() => {
          this.propertiesEditor.abortSave();
          return EMPTY;
        })
      )
      .subscribe(tag => {
        this.card.tags = UnionIfNotExistsFunction(this.card.tags, tag, 'id');
        this.propertiesEditor.commitChanges(this.card.tags);
      });
  }

  removeTag(tag: Tag, property: EditorProperty<Tag[]>) {
    this.isSaveInProgress = true;
    this.apiService
      .removeTag(this.card.id, tag.id)
      .pipe(
        finalize(() => this.isSaveInProgress = false)
      )
      .subscribe(() => {
        const indexOfTag = this.card.tags.indexOf(tag);
        this.card.tags.splice(indexOfTag, 1);
      });
  }

  ngOnInit(): void {
    forkJoin({
      card: of(this.card),
      customProperties: this.apiService.getCustomPropertiesWithValues(),
      columns: this.apiService.getColumns(this.card.board_id)
    }).subscribe((data: { card: CardEx, customProperties: CustomPropertyAndValues[], columns: ColumnEx[] }) => {
      this.extractProperties(data.customProperties);
      this.columns = FlattenColumnsFunction(data.columns);
    });
  }
}
