import { z } from 'zod';

export const ALLOWED_POSITIONS = ['STARTING', 'MIDDLE', 'LAST'] as const;
export type TilePosition = (typeof ALLOWED_POSITIONS)[number];

export const POSITION_LABELS: Record<TilePosition, string> = {
  STARTING: 'Starting',
  MIDDLE: 'Middle',
  LAST: 'Last',
};

export const tileSchema = z.object({
  tileDesignName: z
    .string()
    .min(1, { message: 'Please enter a tile design name.' })
    .min(2, { message: 'Tile design name must be at least 2 characters.' })
    .max(100, { message: 'Tile design name cannot exceed 100 characters.' })
    .transform((val) => val.trim()),
  section: z
    .string()
    .min(1, { message: 'Please select a section.' })
    .transform((val) => val.trim().toUpperCase()),
  position: z.enum(ALLOWED_POSITIONS, {
    message: 'Please select a position.',
  }),
  note: z.string().optional().transform((val) => (val ? val.trim() : undefined)),
  quantity: z
    .number({ message: 'Quantity must be a number.' })
    .int({ message: 'Quantity must be a whole number.' })
    .min(0, { message: 'Quantity cannot be negative.' })
    .optional()
    .default(0),
});

export type TileInput = z.infer<typeof tileSchema>;

export interface TileItem {
  id: string;
  tileDesignName: string;
  section: string;
  position: TilePosition;
  quantity: number;
  note?: string | null;
  createdById?: string | null;
  createdByName?: string | null;
  lastUpdatedById?: string | null;
  lastUpdatedByName?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface SectionItem {
  id: string;
  code: string;
  prefix: string;
  createdAt: string | Date;
}

export interface DashboardStats {
  totalTiles: number;
  todaysEntries: number;
  sectionCounts: Record<string, number>;
  totalSections: number;
}

export interface AuditLogItem {
  id: string;
  tileId: string;
  userId?: string | null;
  userNameSnapshot: string;
  userRole: string;
  actionType: string;
  previousQuantity?: number | null;
  newQuantity?: number | null;
  quantityChanged?: number | null;
  quantitySold?: number | null;
  quantityLoaded?: number | null;
  vehicleNumber?: string | null;
  referenceNumber?: string | null;
  note?: string | null;
  createdAt: string | Date;
}

export interface AuthUserInfo {
  id: string;
  name: string;
  username: string;
  role: 'ADMIN' | 'SUPERVISOR' | 'SALESMAN' | string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  mustChangePassword?: boolean;
}

export interface UserItem {
  id: string;
  name: string;
  username: string;
  role: 'ADMIN' | 'SUPERVISOR' | 'SALESMAN';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  isActive: boolean;
  mustChangePassword?: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export const ACTION_TYPES = {
  TILE_CREATED: 'TILE_CREATED',
  QUANTITY_UPDATE: 'QUANTITY_UPDATE',
  SALE: 'SALE',
  LOADING: 'LOADING',
  TILE_EDITED: 'TILE_EDITED',
  TILE_DELETED: 'TILE_DELETED',
  SECTION_CREATED: 'SECTION_CREATED',
  SECTION_UPDATED: 'SECTION_UPDATED',
  SECTION_DELETED: 'SECTION_DELETED',
} as const;

export const ACTION_LABELS: Record<string, string> = {
  TILE_CREATED: 'Tile Created',
  QUANTITY_UPDATE: 'Stock Update',
  SALE: 'Sale',
  LOADING: 'Loading',
  TILE_EDITED: 'Tile Edited',
  TILE_DELETED: 'Tile Deleted',
  SECTION_CREATED: 'Section Created',
  SECTION_UPDATED: 'Section Updated',
  SECTION_DELETED: 'Section Deleted',
};

// ============================================================
// Display Tile Showcase Types
// ============================================================

export interface DisplayTileItem {
  id: string;
  tileInventoryId?: string | null;
  company: string;
  tileDesign: string;
  category: string;
  size: string;
  imageUrl?: string | null;
  mrp: number;
  finalMrp: number;
  note?: string | null;
  addedById?: string | null;
  addedByName?: string | null;
  addedByRole?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export const DISPLAY_TILE_CATEGORIES = [
  'Floor Tile',
  'Wall Tile',
  'GVT / PGVT',
  'Ceramic Floor',
  'Double Charge',
  'Polished Glazed Vitrified',
  'Slab / Large Format',
  'Outdoor / Parking',
  'Subway / Mosaic',
  'Other',
] as const;

export const COMMON_TILE_SIZES = [
  '600 x 1200 mm (2x4 ft)',
  '800 x 1600 mm (2.6x5.2 ft)',
  '1200 x 1800 mm (4x6 ft)',
  '600 x 600 mm (2x2 ft)',
  '800 x 800 mm (2.6x2.6 ft)',
  '300 x 600 mm (1x2 ft)',
  '300 x 450 mm (1x1.5 ft)',
  '400 x 400 mm (16x16 in)',
  '300 x 300 mm (1x1 ft)',
  'Custom / Other',
] as const;

export const POPULAR_TILE_COMPANIES = [
  'Kajaria',
  'Somany',
  'Simpolo',
  'Varmora',
  'Orientbell',
  'Nitco',
  'Johnson',
  'RAK Ceramics',
  'Qutone',
  'Cera',
  'Sunhearrt',
  'Other',
] as const;

// ============================================================
// Material Panel Types
// ============================================================

export interface MaterialItem {
  id: string;
  company: string;
  materialName: string;
  weight: string;
  category?: string | null;
  mrp: number;
  finalMrp: number;
  note?: string | null;
  addedById?: string | null;
  addedByName?: string | null;
  addedByRole?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export const MATERIAL_CATEGORIES = [
  'Tile Adhesive',
  'Epoxy Grout',
  'Cementitious Grout',
  'Tile Spacers & Levellers',
  'Tile Cleaner & Chemical',
  'Waterproofing & Sealant',
  'Tools & Accessories',
  'Other',
] as const;

export const POPULAR_MATERIAL_COMPANIES = [
  'Roff (Pidilite)',
  'Pidilite',
  'MYK Laticrete',
  'Weber (Saint-Gobain)',
  'Asian Paints SmartCare',
  'Kerakoll',
  'Fosroc',
  'Sika',
  'Dr. Fixit',
  'Other',
] as const;
