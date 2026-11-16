"use client";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import type { Club } from "@/types";

type Props = {
  clubs: Pick<Club, "id" | "name" | "lat" | "lng" | "slug">[];
};

const MAP_CONTAINER_STYLE = { width: "100%", height: "400px" };
const DEFAULT_CENTER = { lat: 6.9271, lng: 79.8612 }; // Colombo

export function ClubMap({ clubs }: Props) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
  });

  if (!isLoaded) {
    return <div className="h-96 w-full animate-pulse rounded-xl bg-gray-100" />;
  }

  return (
    <GoogleMap mapContainerStyle={MAP_CONTAINER_STYLE} zoom={12} center={DEFAULT_CENTER}>
      {clubs.map((club) => (
        <Marker
          key={club.id}
          position={{ lat: club.lat, lng: club.lng }}
          title={club.name}
          onClick={() => (window.location.href = `/clubs/${club.slug}`)}
        />
      ))}
    </GoogleMap>
  );
}
