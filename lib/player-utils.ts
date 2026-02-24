export type PlayerType = 'soundcloud' | 'youtube' | 'unknown';

export function detectPlayerType(url: string): PlayerType {
  if (url.includes('soundcloud.com')) {
    return 'soundcloud';
  }
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  }
  return 'unknown';
}

export function getYouTubeEmbedUrl(url: string): string {
  // Handle youtube.com/watch?v=ID format
  const youtubeMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=0&controls=1`;
  }
  
  // Handle youtu.be/ID format
  const youtuBeMatch = url.match(/youtu\.be\/([^?]+)/);
  if (youtuBeMatch) {
    return `https://www.youtube.com/embed/${youtuBeMatch[1]}?autoplay=0&controls=1`;
  }
  
  // If no valid YouTube URL format found, return empty string
  return '';
}
