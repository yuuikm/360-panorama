export interface User {
  id: number;
  name: string;
  email: string;
}

export type ObjectStatus = 'draft' | 'published' | 'archived';

export interface PanoramaObject {
  id: number;
  title: string;
  description: string | null;
  status: ObjectStatus;
  has_token: boolean;
  published_at: string | null;
  panoramas_count: number;
  panoramas?: Panorama[];
  created_at?: string;
  updated_at?: string;
}

export interface Panorama {
  id: number;
  object_id: number;
  title: string;
  image_path: string;
  image_url: string;
  image_mime_type: string;
  image_size: number;
  width: number | null;
  height: number | null;
  sort_order: number;
  status: 'draft' | 'ready';
  viewer_type?: 'flat' | '360';
  annotations_count?: number;
  annotations?: Annotation[];
  created_at?: string;
  updated_at?: string;
}

export type AnnotationType = 'label' | 'measurement' | 'callout' | 'marker';

export interface AnnotationPosition {
  x?: number;
  y?: number;
  x2?: number;
  y2?: number;
  yaw?: number;
  pitch?: number;
}

export interface AnnotationContent {
  title?: string;
  text?: string;
  value?: string;
  unit?: string;
  icon?: string;
  [key: string]: any;
}

export interface AnnotationStyle {
  color?: string;
  backgroundColor?: string;
  badgeColor?: string;
  [key: string]: any;
}

export interface Annotation {
  id: number;
  panorama_id: number;
  type: AnnotationType;
  template_key: string;
  position: AnnotationPosition;
  content: AnnotationContent;
  style?: AnnotationStyle;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface PublicAnnotation {
  id: number;
  type: AnnotationType;
  template_key: string;
  position: AnnotationPosition;
  content: AnnotationContent;
  style?: AnnotationStyle;
  sort_order: number;
}

export interface PublicPanorama {
  id: number;
  title: string;
  image_url: string;
  width: number | null;
  height: number | null;
  sort_order: number;
  viewer_type?: 'flat' | '360';
  annotations: PublicAnnotation[];
}

export interface PublicObject {
  title: string;
  description: string | null;
  published_at: string | null;
  panoramas: PublicPanorama[];
}

export interface PublishResult {
  message: string;
  object: PanoramaObject;
  public_token: string;
  public_url: string;
  qr_code_svg: string;
  qr_code_data_uri: string;
}

export interface ApiResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  links?: {
    first?: string;
    last?: string;
    prev?: string | null;
    next?: string | null;
  };
  meta?: {
    current_page: number;
    from: number | null;
    last_page: number;
    per_page: number;
    to: number | null;
    total: number;
  };
}

