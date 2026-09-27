export interface TrainSchedule {
  id?: number;
  origin?: string;
  destination?: string;
  departureTime?: string;
  trainId?: number;
  trainName?: string;
  trainNumber?: number | string;
  price?: number;
  fare?: number;
}

export interface TrainCoach {
  id?: number;
  name?: string;
  number?: number | string;
  coachNumber?: number | string;
  type?: string;
  category?: string;
  class?: string;
  seats?: number;
  capacity?: number;
  price?: number;
  fare?: number;
}

export interface Train {
  id?: number;
  name?: string;
  trainName?: string;
  title?: string;
  trainId?: number;
  number?: number | string;
  trainNumber?: number | string;
  from?: string;
  fromStation?: string;
  origin?: string;
  departure?: string;
  startStation?: string;
  to?: string;
  toStation?: string;
  destination?: string;
  arrival?: string;
  endStation?: string;
  seats?: number;
  totalSeats?: number;
  availableSeats?: number;
  seatCount?: number;
  seatsCount?: number;
  coaches?: number;
  numberOfCoaches?: number;
  coachCount?: number;
  numCoaches?: number;
  coachesCount?: number;
  image?: string;
  imageUrl?: string;
  photo?: string;
  thumbnail?: string;
  img?: string;
  price?: number;
  ticketPrice?: number;
  cost?: number;
  status?: string;
  departureTime?: string;
  arrivalTime?: string;
  duration?: string;
  schedules?: TrainSchedule[];
}
