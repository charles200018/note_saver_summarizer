declare module "youtube-captions-scraper" {
  export interface SubtitleLine {
    start: string;
    dur: string;
    text: string;
  }

  export interface GetSubtitlesOptions {
    videoID: string;
    lang?: string;
  }

  export function getSubtitles(options: GetSubtitlesOptions): Promise<SubtitleLine[]>;
}
