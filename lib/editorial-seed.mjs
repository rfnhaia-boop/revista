import { migratedEditorialSeed } from "./migrated-editorial-seed.mjs";
import { applyEditorialPatches } from "./editorial-patches.mjs";

export const SEED_VERSION = "Apresentação editorial v0.1 · 08/10/2026. Histórico científico ainda não disponível.";
export const SEED_PULL = "A comunidade financia perguntas, nunca respostas.";

export const editorialSeed = [
  ...migratedEditorialSeed.map(applyEditorialPatches),
];
