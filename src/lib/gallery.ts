// Albums for the /gallery page. Photos live in public/media/gallery/<album id>/ (resized to 1600px on the
// long side); add each new photo's size to src/lib/images.ts.

export type Album = {
  id: string;
  title: string;
  /** Shown next to the title, e.g. "May 2026". */
  when?: string;
  description: string;
  photos: string[];
};

const photos = (id: string, count: number) =>
  Array.from({ length: count }, (_, i) => `/media/gallery/${id}/${String(i + 1).padStart(2, "0")}.jpg`);

export const ALBUMS: Album[] = [
  {
    id: "hotel-st-elise",
    title: "Team Night at Hotel St Elise",
    when: "May 2026",
    description: "An evening together over dinner — and, of course, plenty of group photos.",
    photos: photos("hotel-st-elise", 8),
  },
  {
    id: "client-visit-2024",
    title: "Client Visit",
    when: "2024",
    description: "Showing our clients around: ATV rides, cave tours, good food and time with the team.",
    photos: photos("client-visit-2024", 14),
  },
  {
    id: "team-life",
    title: "Team Life",
    description: "Dinners out and everyday moments with the people who make Hive, Hive.",
    photos: photos("team-life", 5),
  },
];
