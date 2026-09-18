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
});

export type TileInput = z.infer<typeof tileSchema>;

export interface TileItem {
  id: string;
  tileDesignName: string;
  section: string;
  position: TilePosition;
  note?: string | null;
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
