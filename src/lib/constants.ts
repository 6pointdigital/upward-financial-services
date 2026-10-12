export const CATEGORIES = [
  "Semi Trucks & Tractors",
  "Box & Straight Trucks",
  "Dump Trucks",
  "Trailers",
  "Bulldozers & Dozers",
  "Excavators",
  "Wheel Loaders",
  "Backhoes",
  "Skid Steers & Track Loaders",
  "Motor Graders",
  "Cranes",
  "Forklifts & Material Handling",
  "Aerial Lifts",
  "Agricultural Equipment",
  "Buses & Vans",
  "Other Equipment",
] as const;

export const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME",
  "MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI",
  "SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
] as const;

export const ASSET_STATUSES = ["draft", "pending", "approved", "rejected", "sold"] as const;
export type AssetStatus = (typeof ASSET_STATUSES)[number];

export const STATUS_LABELS: Record<AssetStatus, string> = {
  draft: "Draft",
  pending: "Pending review",
  approved: "Approved · live",
  rejected: "Needs changes",
  sold: "Sold",
};

export const MAX_PHOTOS = 20;
export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
export const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
