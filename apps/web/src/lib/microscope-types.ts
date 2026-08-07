export interface MicroscopeHotspot {
  id: string;
  slideId: string;
  xPercent: number;
  yPercent: number;
  label: string;
  tissueName: string;
  tissueFunction: string;
  characteristics: string;
  location: string;
  example: string;
  createdAt: string;
}

export interface MicroscopeSlideSummary {
  id: string;
  tissueName: string;
  description: string;
  slideImageUrl: string;
  isPublished: boolean;
  order: number;
  createdAt: string;
  materialSection: { id: string; title: string; slug?: string };
  _count?: { hotspots: number };
}

export interface MicroscopeSlideDetail extends MicroscopeSlideSummary {
  hotspots: MicroscopeHotspot[];
}

export interface MaterialSectionOption {
  id: string;
  title: string;
  isPublished: boolean;
}
