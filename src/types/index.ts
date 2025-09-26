// User types
export interface User {
  id: string;
  name: string;
  handle: string;
  email?: string;
  image?: string;
  bio?: string;
  isAnonymous: boolean;
  imageCount: number;
  likeCount: number;
  followerCount: number;
  followingCount: number;
  createdAt: string;
  updatedAt: string;
}

// Image types
export interface Image {
  id: string;
  userId: string;
  user?: User;
  prompt: string;
  negativePrompt?: string;
  model: string;
  guidance: number;
  steps: number;
  seed?: number;
  aspectRatio: string;
  width: number;
  height: number;
  bytes: number;
  sha256: string;
  r2Bucket: string;
  r2Key: string;
  isPrivate: boolean;
  parentId?: string; // For remixes
  parent?: Image;
  tags: Tag[];
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface Like {
  userId: string;
  imageId: string;
  user?: User;
  createdAt: string;
}

export interface Comment {
  id: string;
  imageId: string;
  userId: string;
  user?: User;
  content: string;
  createdAt: string;
}

export interface Follow {
  followerId: string;
  followingId: string;
  follower?: User;
  following?: User;
  createdAt: string;
}

// Generation types
export type ImageQuality = "fast" | "quality";
export type AspectRatio = "1:1" | "16:9" | "9:16" | "3:4" | "4:3" | "21:9";

export interface GenerationJob {
  id: string;
  userId?: string;
  prompt: string;
  negativePrompt?: string;
  quality: ImageQuality;
  guidance: number;
  steps: number;
  seed?: number;
  aspectRatio: AspectRatio;
  width: number;
  height: number;
  tags?: string[];
  isPrivate: boolean;
  status: "pending" | "processing" | "completed" | "failed";
  error?: string;
  resultImageId?: string;
  turnstileToken?: string;
  createdAt: string;
  updatedAt: string;
}

// API response types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    cursor?: string;
    hasMore: boolean;
    total?: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Search and filter types
export interface SearchParams {
  query?: string;
  tags?: string[];
  userId?: string;
  quality?: ImageQuality;
  aspectRatio?: AspectRatio;
  sortBy?: "newest" | "trending" | "popular";
  cursor?: string;
  limit?: number;
}

export interface ExploreParams {
  sortBy: "newest" | "trending" | "popular";
  cursor?: string;
  limit?: number;
  tags?: string[];
}

// Admin/Analytics types
export interface AdminStats {
  users: {
    total: number;
    anonymous: number;
    verified: number;
  };
  images: {
    total: number;
    public: number;
    private: number;
    totalBytes: number;
  };
  activity: {
    likesTotal: number;
    commentsTotal: number;
    generationsToday: number;
  };
  performance: {
    cfAiLatency: number;
    d1QueryTime: number;
    kvHitRate: number;
    r2StorageUsed: number;
  };
}

// Form types
export interface GenerateFormData {
  prompt: string;
  negativePrompt?: string;
  quality: ImageQuality;
  guidance: number;
  steps: number;
  seed?: number;
  aspectRatio: AspectRatio;
  tags?: string[];
  isPrivate: boolean;
}

export interface ProfileFormData {
  name: string;
  handle: string;
  bio?: string;
  image?: string;
}

// UI state types
export interface ThemeState {
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
}

export interface LocaleState {
  locale: "en" | "ja";
  setLocale: (locale: "en" | "ja") => void;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: unknown;
}

// Next.js page props
export interface PageProps {
  params: Promise<{ [key: string]: string | string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Layout props
export interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

// No default export needed for type-only file
