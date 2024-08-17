import { Routes } from '@angular/router';
import { BoardPageComponent } from './pages/board-page/board-page.component';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { CardPageComponent } from './pages/card-page/card-page.component';
import { cardResolver } from './resolvers/card.resolver';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { boardResolver } from './resolvers/board.resolver';

export const routes: Routes = [
  {
    path: 'board/:boardId',
    component: BoardPageComponent,
    resolve: {
      board: boardResolver
    }
  },
  {
    path: 'card/:cardId',
    component: CardPageComponent,
    resolve: {
      card: cardResolver
    },
  },
  {
    path: 'login',
    component: LoginPageComponent
  },
  {
    path: '',
    component: HomePageComponent
  }
];
