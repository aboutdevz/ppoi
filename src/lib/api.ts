import { PaginatedResponse } from "@/types";

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

class ApiClient {
  private baseUrl: string;
  private userToken: string | null = null;

  constructor() {
    // Use environment variable or default based on environment
    this.baseUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://ppoi.poipoi.click/v1"
        : "http://localhost:8787/v1");
  }

  // Set user token for authenticated requests
  setUserToken(token: string | null) {
    this.userToken = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Safely merge additional headers
    if (options.headers) {
      const additionalHeaders = options.headers as Record<string, string>;
      Object.assign(headers, additionalHeaders);
    }

    // Add user token if available
    if (this.userToken) {
      headers["X-PPOI-User"] = this.userToken;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // Fallback to status text if no JSON error
          errorMessage = response.statusText || errorMessage;
        }
        throw new ApiError(errorMessage, response.status);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Network error occurred", 0);
    }
  }

  // Generation endpoints
  async generateImage(data: {
    prompt: string;
    negativePrompt?: string;
    quality?: "fast" | "quality";
    guidance?: number;
    steps?: number;
    seed?: number;
    aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
    tags?: string[];
    isPrivate?: boolean;
  }) {
    return this.request<{
      jobId: string;
      status: string;
      message: string;
    }>("/generate", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getGenerationStatus(jobId: string) {
    return this.request<{
      jobId: string;
      status: "pending" | "processing" | "completed" | "failed";
      progress?: number;
      error?: string;
      image?: {
        id: string;
        url: string;
        prompt: string;
        aspectRatio: string;
        width: number;
        height: number;
      };
    }>(`/generate/status/${jobId}`);
  }

  // Image endpoints
  async getImageDetails(imageId: string) {
    return this.request<{
      image: {
        id: string;
        url: string;
        prompt: string;
        negativePrompt?: string;
        model: string;
        guidance: number;
        steps: number;
        seed?: number;
        aspectRatio: string;
        width: number;
        height: number;
        isPrivate: boolean;
        parentId?: string;
        likeCount: number;
        commentCount: number;
        createdAt: string;
        user: {
          id: string;
          name: string;
          handle: string;
          image?: string;
          isAnonymous: boolean;
        };
        tags: string[];
        isLiked: boolean;
      };
    }>(`/images/${imageId}`);
  }

  async deleteImage(imageId: string) {
    return this.request<{ success: boolean; message: string }>(
      `/images/${imageId}`,
      { method: "DELETE" },
    );
  }

  async remixImage(
    imageId: string,
    data: {
      prompt: string;
      negativePrompt?: string;
      quality?: "fast" | "quality";
      guidance?: number;
      steps?: number;
      aspectRatio?: string;
      tags?: string[];
      isPrivate?: boolean;
    },
  ) {
    return this.request<{
      jobId: string;
      status: string;
      message: string;
      parentImageId: string;
    }>(`/images/remix`, {
      method: "POST",
      body: JSON.stringify({
        ...data,
        parentImageId: imageId,
      }),
    });
  }

  // Explore endpoints
  async getExploreImages(
    params: {
      page?: number;
      limit?: number;
      sortBy?: "recent" | "popular" | "trending";
      aspectRatio?: string;
      tags?: string[];
    } = {},
  ) {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.set("page", params.page.toString());
    if (params.limit) searchParams.set("limit", params.limit.toString());
    if (params.sortBy) searchParams.set("sortBy", params.sortBy);
    if (params.aspectRatio) searchParams.set("aspectRatio", params.aspectRatio);
    if (params.tags?.length) searchParams.set("tags", params.tags.join(","));

    return this.request<
      PaginatedResponse<{
        id: string;
        url: string;
        prompt: string;
        model: string;
        aspectRatio: string;
        width: number;
        height: number;
        likeCount: number;
        commentCount: number;
        createdAt: string;
        user: {
          id: string;
          name: string;
          handle: string;
          image?: string;
          isAnonymous: boolean;
        };
        tags: string[];
      }>
    >(`/explore?${searchParams}`);
  }

  async getTrendingTags(limit = 10) {
    return this.request<{
      tags: Array<{ name: string; count: number }>;
    }>(`/explore/trending-tags?limit=${limit}`);
  }

  // Search endpoints
  async searchImages(
    query: string,
    params: {
      page?: number;
      limit?: number;
      type?: "images" | "users" | "prompts" | "similar";
    } = {},
  ) {
    const searchParams = new URLSearchParams({ q: query });

    if (params.page) searchParams.set("page", params.page.toString());
    if (params.limit) searchParams.set("limit", params.limit.toString());
    if (params.type) searchParams.set("type", params.type);

    return this.request<{
      results: Array<{
        type: "image" | "user" | "prompt";
        id: string;
        url?: string;
        prompt?: string;
        aspectRatio?: string;
        likeCount?: number;
        commentCount?: number;
        createdAt?: string;
        similarity?: number;
        user?: {
          id: string;
          name: string;
          handle: string;
          image?: string;
          isAnonymous?: boolean;
        };
        tags?: string[];
        [key: string]: unknown;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
      query: string;
      type: string;
    }>(`/search?${searchParams}`);
  }

  async findSimilarImages(
    query: string,
    params: {
      page?: number;
      limit?: number;
    } = {},
  ) {
    return this.searchImages(query, { ...params, type: "similar" });
  }

  // Social endpoints
  async likeImage(imageId: string) {
    return this.request<{
      success: boolean;
      isLiked: boolean;
      likeCount: number;
    }>(`/like`, {
      method: "POST",
      body: JSON.stringify({ imageId }),
    });
  }

  async commentOnImage(imageId: string, content: string) {
    return this.request<{
      comment: {
        id: string;
        content: string;
        createdAt: string;
        user: {
          id: string;
          name: string;
          handle: string;
          image?: string;
        };
      };
    }>(`/comment`, {
      method: "POST",
      body: JSON.stringify({ imageId, content }),
    });
  }

  async getImageComments(imageId: string, page = 1, limit = 20) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    return this.request<
      PaginatedResponse<{
        id: string;
        content: string;
        createdAt: string;
        user: {
          id: string;
          name: string;
          handle: string;
          image?: string;
        };
      }>
    >(`/comments/${imageId}?${params}`);
  }

  async toggleFollow(userId: string) {
    return this.request<{
      success: boolean;
      isFollowing: boolean;
      followerCount: number;
    }>(`/follow/toggle`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }

  async followUser(userId: string) {
    return this.request<{ success: boolean; isFollowing: boolean }>(`/follow`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }

  async unfollowUser(userId: string) {
    return this.request<{ success: boolean }>(`/follow`, {
      method: "DELETE",
      body: JSON.stringify({ userId }),
    });
  }

  async getFollowers(userId: string, page = 1, limit = 20) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    return this.request<{
      users: Array<{
        id: string;
        name: string;
        handle: string;
        image?: string;
        bio?: string;
        isAnonymous: boolean;
        isFollowing: boolean;
        stats: {
          imageCount: number;
          followerCount: number;
          followingCount: number;
        };
        followedAt: string;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
      };
    }>(`/follow/${userId}/followers?${params}`);
  }

  async getFollowing(userId: string, page = 1, limit = 20) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    return this.request<{
      users: Array<{
        id: string;
        name: string;
        handle: string;
        image?: string;
        bio?: string;
        isAnonymous: boolean;
        isFollowing: boolean;
        stats: {
          imageCount: number;
          followerCount: number;
          followingCount: number;
        };
        followedAt: string;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
      };
    }>(`/follow/${userId}/following?${params}`);
  }

  async getUserLikedImages(params: { page?: number; limit?: number } = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", params.page.toString());
    if (params.limit) searchParams.set("limit", params.limit.toString());

    return this.request<{
      images: Array<{
        id: string;
        prompt: string;
        url: string;
        aspectRatio: string;
        width: number;
        height: number;
        model: string;
        isPrivate: boolean;
        likeCount: number;
        commentCount: number;
        createdAt: string;
        likedAt: string;
        user: {
          id: string;
          name: string;
          handle: string;
          image?: string;
          isAnonymous: boolean;
        };
      }>;
      pagination: {
        page: number;
        limit: number;
        hasNext: boolean;
      };
    }>(`/likes?${searchParams}`);
  }

  // User profile management
  async updateUserProfile(
    userId: string,
    updates: {
      name?: string;
      bio?: string;
      image?: string;
    },
  ) {
    return this.request<{
      success: boolean;
      user: {
        id: string;
        name: string;
        handle: string;
        email: string;
        image?: string;
        bio?: string;
        isAnonymous: boolean;
        stats: {
          imageCount: number;
          likeCount: number;
          followerCount: number;
          followingCount: number;
        };
        createdAt: string;
        updatedAt: string;
      };
    }>(`/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  async getUserProfile(userId: string) {
    return this.request<{
      id: string;
      name: string;
      handle: string;
      image?: string;
      bio?: string;
      isAnonymous: boolean;
      stats: {
        imageCount: number;
        likeCount: number;
        followerCount: number;
        followingCount: number;
      };
      createdAt: string;
      isFollowing: boolean;
      canViewFull: boolean;
      email?: string; // Only present for own profile
    }>(`/users/${userId}`);
  }

  async getUserByHandle(handle: string) {
    return this.request<{
      id: string;
      name: string;
      handle: string;
      image?: string;
      bio?: string;
      isAnonymous: boolean;
      stats: {
        imageCount: number;
        likeCount: number;
        followerCount: number;
        followingCount: number;
      };
      createdAt: string;
      isFollowing: boolean;
      canViewFull: boolean;
      email?: string; // Only present for own profile
    }>(`/users/handle/${handle}`);
  }

  async getUserImages(userId: string, page = 1, limit = 20) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    return this.request<{
      data: Array<{
        id: string;
        url: string;
        prompt: string;
        aspectRatio: string;
        width: number;
        height: number;
        likeCount: number;
        commentCount: number;
        isPrivate: boolean;
        createdAt: string;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
      };
    }>(`/users/${userId}/images?${params}`);
  }
}

// Export singleton instance
export const api = new ApiClient();

// Export the class and error for use elsewhere
export { ApiClient, ApiError };
