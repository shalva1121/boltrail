import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Trains } from './trains/trains';
import { Register } from './auth/register/register';
import { SignIn } from './auth/sign-in/sign-in';
import { Profile } from './profile/profile';
import { TrainDetail } from './train-detail/train-detail';
import { authGuard } from './auth.guard';
import { CoachSelect } from './booking/coach-select/coach-select';
import { DateSelect } from './booking/date-select/date-select';
import { SeatSelect } from './booking/seat-select/seat-select';
import { BookingConfirm } from './booking/confirm/confirm';
import { BookingDetail } from './booking/booking-detail/booking-detail';

export const routes: Routes = [
  { path: '', component: Home, pathMatch: 'full' },
  { path: 'trains', component: Trains },
  { path: 'trains/:id', component: TrainDetail },
  { path: 'register', component: Register },
  { path: 'sign-in', component: SignIn },
  { path: 'profile', component: Profile, canActivate: [authGuard] },
  { path: 'bookings/:id', component: BookingDetail, canActivate: [authGuard] },
  { path: 'booking/:trainId/:scheduleId/coach', component: CoachSelect, canActivate: [authGuard] },
  { path: 'booking/:trainId/:scheduleId/date', component: DateSelect, canActivate: [authGuard] },
  { path: 'booking/:trainId/:scheduleId/seats', component: SeatSelect, canActivate: [authGuard] },
  { path: 'booking/:trainId/:scheduleId/confirm', component: BookingConfirm, canActivate: [authGuard] }
];
