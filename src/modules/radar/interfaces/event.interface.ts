export interface Event {
  id: string;
  title: string;
  category: string;
  start_local: string;
  true_end: string;
  end_local: string;
  predicted_end_local: string | null;
  check_timings: string | null;
  phq_attendance: string;
  attendance: string;
  venue_id: string | null;
  venue_name: string | null;
  postcode: string | null;
  venue_formatted_address: string;
  lat: number;
  lon: string;
  labels: string;
  geometry: {
    type: string;
    coordinates: [number, number];
  };
}
