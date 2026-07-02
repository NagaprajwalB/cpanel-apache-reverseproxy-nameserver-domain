export interface ProjectMetadata {
  budget?: number;
  possessionDate?: string;
  launchDate?: string;
  availableUnits?: number;
  soldUnits?: number;
  totalUnits?: number;
  gallery?: string[];
  amenities?: string[];
  masterPlanUrl?: string;
  brochureUrl?: string;
  reraNumber?: string;
  developerName?: string;
  projectType?: string;
  latitude?: number;
  longitude?: number;
  progressPercent?: number;
  constructionStage?: string;
  completionTimeline?: string;
  investmentRating?: string;
  highlights?: string[];
  landmarks?: string[];
  connectivity?: string;
  healthScore?: number;
}

export function parseProjectDescription(rawDescription: string = '') {
  if (!rawDescription) return { description: '', metadata: {} as ProjectMetadata };
  const parts = rawDescription.split('---METADATA---');
  const description = parts[0]?.trim() || '';
  let metadata: ProjectMetadata = {};
  if (parts[1]) {
    try {
      metadata = JSON.parse(parts[1].trim());
    } catch (e) {
      console.error('Failed to parse project metadata:', e);
    }
  }
  return { description, metadata };
}

export function serializeProjectDescription(description: string, metadata: ProjectMetadata) {
  return `${description.trim()}\n\n---METADATA---\n${JSON.stringify(metadata)}`;
}

export interface PropertyMetadata {
  virtualTourUrl?: string;
  floorPlanUrl?: string;
  propertyCode?: string;
  furnishingStatus?: string;
  facingDirection?: string;
  possessionStatus?: string;
  propertyAge?: number;
  investmentScore?: number;
  rentalYield?: number;
}

export function parsePropertyDescription(rawDescription: string = '') {
  if (!rawDescription) return { description: '', metadata: {} as PropertyMetadata };
  const parts = rawDescription.split('---METADATA---');
  const description = parts[0]?.trim() || '';
  let metadata: PropertyMetadata = {};
  if (parts[1]) {
    try {
      metadata = JSON.parse(parts[1].trim());
    } catch (e) {
      console.error('Failed to parse property metadata:', e);
    }
  }
  return { description, metadata };
}

export function serializePropertyDescription(description: string, metadata: PropertyMetadata) {
  return `${description.trim()}\n\n---METADATA---\n${JSON.stringify(metadata)}`;
}

// Extract Project ID from keywords string (format: project-id:XXX)
export function getProjectIdFromKeywords(keywords: string = ''): number | null {
  if (!keywords) return null;
  const match = keywords.split(',').find(k => k.trim().startsWith('project-id:'));
  if (match) {
    const idStr = match.split(':')[1]?.trim();
    return idStr ? Number(idStr) : null;
  }
  return null;
}

// Update or set Project ID in keywords string
export function setProjectIdInKeywords(keywords: string = '', projectId?: number): string {
  const kwList = keywords ? keywords.split(',').map(k => k.trim()).filter(k => !k.startsWith('project-id:')) : [];
  if (projectId !== undefined && projectId !== null) {
    kwList.push(`project-id:${projectId}`);
  }
  return kwList.join(', ');
}

// ==========================================
// Amenity Metadata
// ==========================================
export interface AmenityMetadata {
  category?: string;
  imageUrl?: string;
  isFeatured?: boolean;
}

export function parseAmenityDescription(rawDescription: string = '') {
  if (!rawDescription) return { description: '', metadata: {} as AmenityMetadata };
  const parts = rawDescription.split('---METADATA---');
  const description = parts[0]?.trim() || '';
  let metadata: AmenityMetadata = {};
  if (parts[1]) {
    try {
      metadata = JSON.parse(parts[1].trim());
    } catch (e) {
      console.error('Failed to parse amenity metadata:', e);
    }
  }
  return { description, metadata };
}

export function serializeAmenityDescription(description: string, metadata: AmenityMetadata) {
  return `${description.trim()}\n\n---METADATA---\n${JSON.stringify(metadata)}`;
}

// ==========================================
// Team Member Metadata
// ==========================================
export interface TeamMetadata {
  department?: string;
  twitter?: string;
  github?: string;
  isLeadership?: boolean;
}

export function parseTeamBio(rawBio: string = '') {
  if (!rawBio) return { bio: '', metadata: {} as TeamMetadata };
  const parts = rawBio.split('---METADATA---');
  const bio = parts[0]?.trim() || '';
  let metadata: TeamMetadata = {};
  if (parts[1]) {
    try {
      metadata = JSON.parse(parts[1].trim());
    } catch (e) {
      console.error('Failed to parse team bio metadata:', e);
    }
  }
  return { bio, metadata };
}

export function serializeTeamBio(bio: string, metadata: TeamMetadata) {
  return `${bio.trim()}\n\n---METADATA---\n${JSON.stringify(metadata)}`;
}

// ==========================================
// Testimonial Metadata
// ==========================================
export interface TestimonialMetadata {
  purchaseYear?: string;
  isFeatured?: boolean;
}

export function parseTestimonialContent(rawContent: string = '') {
  if (!rawContent) return { content: '', metadata: {} as TestimonialMetadata };
  const parts = rawContent.split('---METADATA---');
  const content = parts[0]?.trim() || '';
  let metadata: TestimonialMetadata = {};
  if (parts[1]) {
    try {
      metadata = JSON.parse(parts[1].trim());
    } catch (e) {
      console.error('Failed to parse testimonial content metadata:', e);
    }
  }
  return { content, metadata };
}

export function serializeTestimonialContent(content: string, metadata: TestimonialMetadata) {
  return `${content.trim()}\n\n---METADATA---\n${JSON.stringify(metadata)}`;
}

// ==========================================
// Enquiry Metadata
// ==========================================
export interface EnquiryMetadata {
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
  assignedTo?: string;
}

export function parseEnquiryMessage(rawMessage: string = '') {
  if (!rawMessage) return { message: '', metadata: {} as EnquiryMetadata };
  const parts = rawMessage.split('---METADATA---');
  const message = parts[0]?.trim() || '';
  let metadata: EnquiryMetadata = {};
  if (parts[1]) {
    try {
      metadata = JSON.parse(parts[1].trim());
    } catch (e) {
      console.error('Failed to parse enquiry message metadata:', e);
    }
  }
  return { message, metadata };
}

export function serializeEnquiryMessage(message: string, metadata: EnquiryMetadata) {
  return `${message.trim()}\n\n---METADATA---\n${JSON.stringify(metadata)}`;
}

// ==========================================
// Site Settings Metadata (SEO & Business Info)
// ==========================================
export interface SettingsMetadata {
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  reraNumber?: string;
  siteDomain?: string;
}

export function parseSettingsFooter(rawFooter: string = '') {
  if (!rawFooter) return { footerText: '', metadata: {} as SettingsMetadata };
  const parts = rawFooter.split('---METADATA---');
  const footerText = parts[0]?.trim() || '';
  let metadata: SettingsMetadata = {};
  if (parts[1]) {
    try {
      metadata = JSON.parse(parts[1].trim());
    } catch (e) {
      console.error('Failed to parse settings footer metadata:', e);
    }
  }
  return { footerText, metadata };
}

export function serializeSettingsFooter(footerText: string, metadata: SettingsMetadata) {
  return `${footerText.trim()}\n\n---METADATA---\n${JSON.stringify(metadata)}`;
}


