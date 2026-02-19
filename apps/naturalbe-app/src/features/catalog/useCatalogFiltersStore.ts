import { create } from "zustand";
import type { CatalogSort } from "./types";

type CatalogFiltersState = {
  search: string;
  category: string;
  sort: CatalogSort;
  setSearch: (value: string) => void;
  setCategory: (value: string) => void;
  setSort: (value: CatalogSort) => void;
  reset: () => void;
};

const initialState = {
  search: "",
  category: "Todos",
  sort: "featured" as const
};

export const useCatalogFiltersStore = create<CatalogFiltersState>((set) => ({
  ...initialState,
  setSearch: (value) => set({ search: value }),
  setCategory: (value) => set({ category: value }),
  setSort: (value) => set({ sort: value }),
  reset: () => set(initialState)
}));
