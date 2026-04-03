declare module "youtube-captions-scraper" {
  export type SubtitleCaption = {
    text: string;
    start?: number;
    dur?: number;
  };

  export function getSubtitles(input: {
    videoID: string;
    lang?: string;
  }): Promise<SubtitleCaption[]>;
}
