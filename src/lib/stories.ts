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
  story("Jiliane", "jiliane", "/media/team/jilian-portrait.jpg"),
  story("Ylaizza", "ylaizza", "/media/team/ylaiza-portrait.jpg"),
  story("Angelica", "angelica", "/media/team/angela-portrait.jpg"),
  // White-background headshot used as the poster.
  story("Jayrrah", "jayrrah", "/media/team/jayrrah.png"),
  // Hidden for now — restore by uncommenting.
  // story("May Ann", "may-ann"),
  // story("JB", "jb"),
  // story("Natalie", "natalie"),
];
