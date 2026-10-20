// Content for the "Video Stories" section (home and careers pages).
// Videos and posters live in public/media/stories/.
// Add a `role` (e.g. "Customer Service · Finance") to show it under the name.

export type VideoStory = {
  name: string;
  role?: string;
  video: string;
  poster: string;
};

const story = (name: string, slug: string, role?: string): VideoStory => ({
  name,
  role,
  video: `/media/stories/${slug}.mp4`,
  poster: `/media/stories/${slug}.jpg`,
});

/** Portrait (phone) videos shown in the scrolling row. */
export const VIDEO_STORIES: VideoStory[] = [
  story("Jiliane", "jiliane-armena"),
  story("Ylaizza", "ylaizza-balisoro"),
  story("May Ann", "may-ann-basallote"),
  story("JB", "jb-lozada"),
  story("Natalie", "natalie-marantal"),
  story("Angelica", "angelica-ortiz"),
  story("Jayrrah", "jayrrah-presente"),
];
