import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface SocialMethod {
  label: string;
  allowed_media: string[];
  aspect_ratio: string[];
  max_chars: number;
  max_hashtags: number;
  video_max_duration_sec?: number;
}

export interface SocialPlatformRules {
  name: string;
  global_max_chars: number;
  methods: Record<string, SocialMethod>;
}

export interface SocialRules {
  platforms: Record<string, SocialPlatformRules>;
}

export const DEFAULT_SOCIAL_RULES: SocialRules = {
  platforms: {
    tiktok: {
      name: "TikTok",
      global_max_chars: 4000,
      methods: {
        reel: {
          label: "Reel",
          allowed_media: ["video"],
          aspect_ratio: ["9:16"],
          max_chars: 4000,
          max_hashtags: 5,
          video_max_duration_sec: 600
        }
      }
    },
    instagram: {
      name: "Instagram",
      global_max_chars: 2200,
      methods: {
        reel: {
          label: "Reel",
          allowed_media: ["video"],
          aspect_ratio: ["9:16"],
          max_chars: 2200,
          max_hashtags: 5,
          video_max_duration_sec: 90
        },
        feed: {
          label: "Post de Feed",
          allowed_media: ["image", "video"],
          aspect_ratio: ["1:1", "4:5"],
          max_chars: 2200,
          max_hashtags: 5
        },
        story: {
          label: "Historia",
          allowed_media: ["image", "video"],
          aspect_ratio: ["9:16"],
          max_chars: 125,
          max_hashtags: 0
        }
      }
    },
    facebook: {
      name: "Facebook",
      global_max_chars: 63206,
      methods: {
        feed: {
          label: "Publicación de Muro",
          allowed_media: ["image", "video"],
          aspect_ratio: ["1:1", "4:5", "16:9"],
          max_chars: 63206,
          max_hashtags: 2
        },
        reel: {
          label: "Reel",
          allowed_media: ["video"],
          aspect_ratio: ["9:16"],
          max_chars: 2200,
          max_hashtags: 2
        },
        story: {
          label: "Historia",
          allowed_media: ["image", "video"],
          aspect_ratio: ["9:16"],
          max_chars: 500,
          max_hashtags: 0
        }
      }
    },
    linkedin: {
      name: "LinkedIn",
      global_max_chars: 3000,
      methods: {
        post: {
          label: "Post Profesional",
          allowed_media: ["image", "video", "pdf"],
          aspect_ratio: ["4:5", "16:9"],
          max_chars: 3000,
          max_hashtags: 3
        }
      }
    }
  }
};

export async function fetchSocialRules(): Promise<SocialRules> {
    try {
        const docRef = doc(db, "system_config", "social_rules");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            return snap.data() as SocialRules;
        }
    } catch (e) {
        console.error("Error fetching social rules:", e);
    }
    return DEFAULT_SOCIAL_RULES;
}

export function getCombinedConstraints(selectedPlatforms: string[], rules: SocialRules, currentPostType: string) {
  if (selectedPlatforms.length === 0) {
    return {
      safeCharLimit: 1000, // Fallback default
      allowedMediaTypes: ["image", "video"],
      warning: "",
      forcedType: ""
    };
  }

  let minChars = Infinity;
  let allowedMedia = ["image", "video", "pdf"];
  let warnings: string[] = [];
  let forcedType = "";

  selectedPlatforms.forEach(p => {
    const platformData = rules.platforms[p];
    if (!platformData) return;

    // Char limit (global for platform)
    if (platformData.global_max_chars < minChars) {
      minChars = platformData.global_max_chars;
    }

    // Media types
    // We check all methods of the platform to see what's allowed generally
    // But better: check against the specific method if we can map currentPostType to a method
    // For now, let's look at the "allowed_media" of all methods in this platform
    const platformMedia = Object.values(platformData.methods).flatMap(m => m.allowed_media);
    allowedMedia = allowedMedia.filter(media => platformMedia.includes(media));

    if (p === 'tiktok') {
        warnings.push("TikTok forzará el formato a Reel/Video vertical.");
        forcedType = "Reel";
    }
  });

  // Specifically check against currentPostType if possible
  // mapping: Post -> feed/post, Historia -> story, Carrusel -> feed (usually), Reel -> reel
  const typeMap: Record<string, string> = {
    "Post": "feed",
    "Historia": "story",
    "Carrusel": "feed",
    "Reel": "reel"
  };
  const targetMethod = typeMap[currentPostType] || "feed";

  selectedPlatforms.forEach(p => {
    const platformData = rules.platforms[p];
    if (!platformData) return;

    // Find best matching method
    const method = platformData.methods[targetMethod] || Object.values(platformData.methods)[0];
    if (method.max_chars < minChars) {
        minChars = method.max_chars;
    }
  });

  return {
    safeCharLimit: minChars === Infinity ? 2200 : minChars,
    allowedMediaTypes: [...new Set(allowedMedia)],
    warnings,
    forcedType
  };
}
