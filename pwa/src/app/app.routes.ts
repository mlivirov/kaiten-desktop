import { Routes } from '@angular/router';
import { BoardPageComponent } from './pages/board-page/board-page.component';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { CardPageComponent } from './pages/card-page/card-page.component';
import { cardResolver } from './resolvers/card.resolver';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { boardResolver } from './resolvers/board.resolver';
import { authGuard } from './guards/auth.guard';
import { modalGuard } from './guards/modal.guard';

export const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: HomePageComponent
      },
      {
        path: 'board/:boardId',
        component: BoardPageComponent,
        resolve: {
          board: boardResolver
        },
        runGuardsAndResolvers: 'always'
      },
      {
        path: 'card/:cardId',
        component: CardPageComponent,
        resolve: {
          card: cardResolver
        },
        runGuardsAndResolvers: 'always'
      },
    ],
    canActivate: [authGuard],
    canActivateChild: [modalGuard]
  },
  {
    path: 'login',
    component: LoginPageComponent
  },
];
