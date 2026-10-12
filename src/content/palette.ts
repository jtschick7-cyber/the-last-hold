// GDD §9.12 / technical design §12.2: the one 32-color palette every asset is
// recolored to. Null until the owner picks from the candidates (plan T1.28, Q2).
export interface PaletteChoice {
  readonly name: string;
  readonly author: string;
  readonly source: string;
  readonly colors: readonly string[];
}

export const palette: PaletteChoice | null = null;
