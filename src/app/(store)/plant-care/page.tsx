import type { Metadata } from "next";
import { PlantCareView } from "@/components/plant-care/plant-care-view";

export const metadata: Metadata = {
  title: "Plant Care Guide & Advice | Pick Plant",
  description: "Learn essential watering schedules, light requirements, soil mixtures, repotting advice, and pest control techniques for indoor and outdoor plants.",
};

export default function PlantCarePage() {
  return <PlantCareView />;
}
