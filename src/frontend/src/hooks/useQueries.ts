import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Station } from "../backend";
import type { RadioStation } from "../services/radioBrowserApi";
import { useActor } from "./useActor";

export function useGetFavorites() {
  const { actor, isFetching } = useActor();

  return useQuery<Station[]>({
    queryKey: ["favorites"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFavorites();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddFavorite() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (station: Station) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.addFavorite(station);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
}

export function useRemoveFavorite() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (stationName: string) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.removeFavorite(stationName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
}

// Convert RadioStation (from API) to Station (backend type)
export function toBackendStation(s: RadioStation): Station {
  return {
    name: s.name,
    url: s.url_resolved || s.url,
    country: s.country,
    codec: s.codec,
    bitrate: BigInt(s.bitrate),
    tags: s.tags,
    homepage: s.homepage,
    favicon: s.favicon,
    language: s.language,
  };
}
