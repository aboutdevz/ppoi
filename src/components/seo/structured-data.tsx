/**
 * Structured data components for SEO
 */

interface StructuredDataProps {
  type: "website" | "image" | "person" | "article";
  data: Record<string, unknown>;
}

export function StructuredData({ type, data }: StructuredDataProps) {
  let schema: Record<string, unknown>;

  switch (type) {
    case "website":
      schema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "ppoi",
        description: "AI-powered anime profile picture generator",
        url: "https://ppoi.app",
        potentialAction: {
          "@type": "SearchAction",
          target: "https://ppoi.app/explore?q={search_term_string}",
          "query-input": "required name=search_term_string",
        },
        ...data,
      };
      break;

    case "image":
      schema = {
        "@context": "https://schema.org",
        "@type": "ImageObject",
        contentUrl: data.url,
        name: data.name || "AI Generated Anime Art",
        description:
          data.description || "Beautiful anime-style artwork created with AI",
        author: {
          "@type": "Person",
          name: data.author || "ppoi user",
        },
        creator: {
          "@type": "Organization",
          name: "ppoi",
        },
        dateCreated: data.createdAt,
        width: data.width,
        height: data.height,
        ...data,
      };
      break;

    case "person":
      schema = {
        "@context": "https://schema.org",
        "@type": "Person",
        name: data.name,
        url: data.url,
        image: data.image,
        description: data.bio || data.description,
        sameAs: data.socialLinks || [],
        ...data,
      };
      break;

    case "article":
      schema = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: data.title,
        description: data.description,
        image: data.image,
        author: {
          "@type": "Person",
          name: data.author,
        },
        publisher: {
          "@type": "Organization",
          name: "ppoi",
          logo: {
            "@type": "ImageObject",
            url: "https://ppoi.app/logo.png",
          },
        },
        datePublished: data.publishedAt,
        dateModified: data.modifiedAt || data.publishedAt,
        ...data,
      };
      break;

    default:
      schema = data;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema),
      }}
    />
  );
}

// Website schema for homepage
export function WebsiteSchema() {
  return (
    <StructuredData
      type="website"
      data={{
        author: {
          "@type": "Organization",
          name: "ppoi team",
        },
        keywords: "AI, anime, profile picture, generator, art, avatar",
        inLanguage: "en",
        copyrightYear: new Date().getFullYear(),
        genre: "Technology",
      }}
    />
  );
}

// Organization schema
export function OrganizationSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "ppoi",
          url: "https://ppoi.app",
          logo: "https://ppoi.app/logo.png",
          description: "AI-powered anime profile picture generator platform",
          sameAs: [
            "https://twitter.com/ppoi_app",
            "https://github.com/ppoi-ai",
          ],
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "Customer Service",
            url: "https://ppoi.app/contact",
          },
        }),
      }}
    />
  );
}

// Web Application schema
export function WebApplicationSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "ppoi - AI Anime Profile Picture Generator",
          url: "https://ppoi.app",
          description: "Create stunning AI-generated anime profile pictures",
          applicationCategory: "MultimediaApplication",
          operatingSystem: "Web Browser",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          },
          featureList: [
            "AI image generation",
            "Anime style art",
            "Community sharing",
            "Profile customization",
            "Image remixing",
          ],
          screenshot: "https://ppoi.app/screenshot.png",
        }),
      }}
    />
  );
}
