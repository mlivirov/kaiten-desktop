import { Component, HostListener } from '@angular/core';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { Router } from '@angular/router';
import { CurrentUserComponent } from '../../components/current-user/current-user.component';
import { DialogService } from '../../services/dialogService';
import { filter } from 'rxjs';
import { NgIf, NgOptimizedImage } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Setting } from '../../models/setting';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    PageHeaderComponent,
    CurrentUserComponent,
    NgOptimizedImage,
    NgIf
  ],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent {
  constructor(private router: Router, private dialogService: DialogService, private apiService: ApiService) {
    apiService.getSetting(Setting.LastURL)
      .pipe(
        filter(v => !!v)
      )
      .subscribe(v => router.navigateByUrl(v));
  }

  search() {
    this.dialogService.searchBoard()
      .pipe(filter(r => !!r))
      .subscribe(r => this.router.navigate(['board', r.boardId]));
  }

  @HostListener('window:keydown', ['$event'])
  handleKey(event: KeyboardEvent) {
    if (event.code === 'KeyK' && event.ctrlKey) {
      event.preventDefault();
      event.stopPropagation();

      this.search();
    }
  }
}
