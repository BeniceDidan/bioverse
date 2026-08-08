export interface MaterialSectionSummary {
  id: string;
  slug: string;
  order: number;
  title: string;
  description: string;
  estimatedMinutes: number;
  upload?: { fileUrl: string; fileName: string } | null;
}

export interface MaterialWithSections {
  id: string;
  slug: string;
  title: string;
  description: string;
  sections: MaterialSectionSummary[];
}

export type UploadStatus = "UPLOADED" | "READY_TO_EXPAND" | "EXPANDING" | "EXPANDED" | "FAILED";

export interface MaterialUpload {
  id: string;
  fileName: string;
  fileUrl: string;
  status: UploadStatus;
  errorMessage: string | null;
  createdAt: string;
  materialSection: { id: string; slug: string; title: string; isPublished: boolean } | null;
}

export interface MaterialUploadDetail {
  id: string;
  fileName: string;
  fileUrl: string;
  status: UploadStatus;
  errorMessage: string | null;
  createdAt: string;
  materialSection:
    | (Omit<MaterialSectionDetail, "mediaAssets" | "videos" | "microscopeSlides" | "quizzes"> & {
        isPublished: boolean;
      })
    | null;
}

export interface MaterialSectionDetail extends MaterialSectionSummary {
  learningObjectives: string[];
  competencies: string[];
  indicators: string[];
  contentBody: string;
  structureFunctionNote: string | null;
  realLifeExamples: string[];
  summary: string;
  mediaAssets: unknown[];
  videos: unknown[];
  microscopeSlides: unknown[];
  quizzes: { id: string; type: string; title: string }[];
}
