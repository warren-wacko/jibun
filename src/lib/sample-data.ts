import type { PageData } from "./page-schema";

/** Sample content for the seed and tests. Fictional person; not real client data. */
export const SAMPLE_PAGE_DATA: PageData = {
  profile: {
    fullName: "Maria Santos",
    title: "Product Designer",
    company: "Northwind Studio",
    location: "Cavite, PH",
    workMode: "hybrid",
    bio: "I design simple, useful products.",
    availability: "Replies within a day",
  },
  contact: {
    phone: "+639171234567",
    email: "maria@example.com",
    sms: true,
    showPhoneNumbers: true,
  },
  featuredLink: { label: "View my portfolio", url: "https://example.com/maria", icon: "website" },
  socials: [
    { type: "linkedin", handle: "mariasantos", url: "https://www.linkedin.com/in/mariasantos" },
    { type: "instagram", handle: "maria.designs", url: "https://www.instagram.com/maria.designs" },
    { type: "messenger", handle: "maria.santos", url: "https://m.me/maria.santos" },
    { type: "whatsapp", handle: "+639171234567", url: "https://wa.me/639171234567" },
  ],
  sections: [],
  style: { theme: "light", accent: "blue" },
};
