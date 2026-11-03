// Content for the "Video Stories" section (home and careers pages).
// Videos and default posters live in public/media/stories/; a professional headshot from
// public/media/team/ can be passed in place of the default video-frame poster.
// Add a `role` (e.g. "Customer Service · Finance") to show it under the name.

export type VideoStory = {
  name: string;
  role?: string;
  video: string;
  poster: string;
};

const story = (name: string, slug: string, poster = `/media/stories/${slug}.jpg`, role?: string): VideoStory => ({
  name,
  role,
  video: `/media/stories/${slug}.mp4`,
  poster,
});

/** Portrait (phone) videos shown in the scrolling row. */
export const VIDEO_STORIES: VideoStory[] = [
  story("Jiliane", "jiliane-armena", "/media/team/jilian-armena-portrait.jpg"),
  story("Ylaizza", "ylaizza-balisoro", "/media/team/ylaiza-balisoro-portrait.jpg"),
  story("Angelica", "angelica-ortiz", "/media/team/angela-ortiz-portrait.jpg"),
  // Hidden for now — restore by uncommenting.
  // story("May Ann", "may-ann-basallote"),
  // story("JB", "jb-lozada"),
  // story("Natalie", "natalie-marantal"),
  // story("Jayrrah", "jayrrah-presente"),
];
