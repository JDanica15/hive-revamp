// Content for the "Video Stories" section (home and careers pages).
// Videos and posters live in public/media/stories/; the "Moments" photos come from the /gallery albums.
// Add a `role` (e.g. "Customer Service · Finance") to show it under the name.

export type VideoStory = {
  name: string;
  role?: string;
  video: string;
  poster: string;
};

export type Moment = { src: string; caption: string };

const story = (name: string, slug: string, role?: string): VideoStory => ({
  name,
  role,
  video: `/media/stories/${slug}.mp4`,
  poster: `/media/stories/${slug}.jpg`,
});

/** Landscape (16:9) video shown large at the top. */
export const FEATURED_STORY = story("Mae Anne Delfino", "mae-anne-delfino");

/** Portrait (phone) videos shown in the scrolling row. */
export const VIDEO_STORIES: VideoStory[] = [
  story("Jiliane Armena", "jiliane-armena"),
  story("Ylaizza Balisoro", "ylaizza-balisoro"),
  story("May Ann Basallote", "may-ann-basallote"),
  story("JB Lozada", "jb-lozada"),
  story("Natalie Marantal", "natalie-marantal"),
  story("Angelica Ortiz", "angelica-ortiz"),
  story("Jayrrah Presente", "jayrrah-presente"),
];

/** A few highlights from the /gallery albums. */
export const MOMENTS: Moment[] = [
  { src: "/media/gallery/hotel-st-elise/01.jpg", caption: "Team night · Hotel St Elise" },
  { src: "/media/gallery/client-visit-2024/02.jpg", caption: "ATV ride · Client visit" },
  { src: "/media/gallery/team-life/02.jpg", caption: "Team dinner" },
  { src: "/media/gallery/client-visit-2024/03.jpg", caption: "Cave tour · Client visit" },
  { src: "/media/gallery/hotel-st-elise/02.jpg", caption: "Team dinner · Hotel St Elise" },
  { src: "/media/gallery/client-visit-2024/04.jpg", caption: "Exploring together · Client visit" },
  { src: "/media/gallery/team-life/03.jpg", caption: "Team dinner" },
  { src: "/media/gallery/client-visit-2024/05.jpg", caption: "Day out · Client visit" },
];
