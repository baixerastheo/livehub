type KlipyMediaVariant = {
  url: string;
  width?: number;
  height?: number;
  size?: number;
};

type KlipyResolution = {
  gif?: KlipyMediaVariant;
  webp?: KlipyMediaVariant;
  jpg?: KlipyMediaVariant;
  mp4?: KlipyMediaVariant;
  webm?: KlipyMediaVariant;
};

export type KlipyFile = {
  hd?: KlipyResolution;
  md?: KlipyResolution;
  sm?: KlipyResolution;
  xs?: KlipyResolution;
};

export type Gif = {
  id: string | number;
  title: string;
  slug?: string;
  file?: KlipyFile;
  src?: string;
  proxy_src?: string;
  width?: number;
  height?: number;
  url?: string;
};

