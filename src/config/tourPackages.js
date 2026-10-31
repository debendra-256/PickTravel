import { Landmark, Palmtree, PawPrint } from "lucide-react";
import { assetUrl } from "./assetUrl";

export const TOUR_PACKAGE_CATEGORIES = [
  {
    name: "Spiritual Tours",
    icon: Landmark,
    description: "Puri, Konark & temple circuits"
  },
  {
    name: "Odisha Vacation Tours",
    icon: Palmtree,
    description: "Hills, honeymoon & family trips"
  },
  {
    name: "Wildlife Tours",
    icon: PawPrint,
    description: "Forest safaris & Chilika birding"
  }
];

const PACKAGES_MANIFEST = "TourPackages/Packages.json";
let packagesRequest = null;

export const loadTourPackages = () => {
  if (!packagesRequest) {
    packagesRequest = fetch(assetUrl(PACKAGES_MANIFEST))
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to load ${PACKAGES_MANIFEST}`);
        return response.json();
      })
      .then((data) => (Array.isArray(data) ? data : []))
      .catch((error) => {
        packagesRequest = null;
        throw error;
      });
  }
  return packagesRequest;
};
