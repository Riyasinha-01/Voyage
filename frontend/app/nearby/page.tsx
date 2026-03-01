// "use client";

// import { useEffect, useState } from "react";
// import { fetchNearbyPlaces } from "@/lib/api"; // 🔁 change this path to where your api file exists

// interface Place {
//   name: string;
//   category: string;
//   latitude: number;
//   longitude: number;
//   distance_km: number;
//   image: string;
// }

// export default function NearbyPage() {
//   const [places, setPlaces] = useState<Place[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [locationError, setLocationError] = useState(false);

//   useEffect(() => {
//     if (!navigator.geolocation) {
//       setLocationError(true);
//       return;
//     }

//     navigator.geolocation.getCurrentPosition(
//       (position) => {
//         fetchNearby(position.coords.latitude, position.coords.longitude);
//       },
//       () => {
//         setLocationError(true);
//       }
//     );
//   }, []);

//   const fetchNearby = async (lat: number, lon: number) => {
//     try {
//       setLoading(true);

//       const data = await fetchNearbyPlaces(lat, lon);

//       if (data.error) {
//         console.error(data.error);
//         return;
//       }

//       setPlaces(data);
//     } catch (error) {
//       console.error("Nearby fetch failed:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-black text-white px-8 py-10">
//       <h1 className="text-3xl font-semibold mb-8 text-[#C6A96E]">
//         What’s Nearby
//       </h1>

//       {locationError && (
//         <div className="bg-[#1a1a1a] p-6 rounded-lg border border-gray-800">
//           <p className="text-red-400 mb-3">
//             Location is OFF. Please enable location to discover nearby places.
//           </p>
//         </div>
//       )}

//       {loading && (
//         <p className="text-gray-400 animate-pulse">
//           Discovering places near you...
//         </p>
//       )}

//       {!loading && places.length === 0 && !locationError && (
//         <p className="text-gray-500">No nearby places found.</p>
//       )}

//       <div className="grid md:grid-cols-3 gap-8 mt-8">
//         {places.map((place, index) => (
//           <div
//             key={index}
//             className="bg-[#111] rounded-xl overflow-hidden shadow-lg hover:scale-105 transition duration-300 border border-gray-800"
//           >
//             <img
//               src={place.image}
//               alt={place.name}
//               className="w-full h-52 object-cover"
//             />

//             <div className="p-5">
//               <h2 className="text-xl font-semibold text-[#C6A96E] mb-1">
//                 {place.name}
//               </h2>

//               <p className="text-gray-400 text-sm capitalize">
//                 {place.category}
//               </p>

//               <p className="text-sm mt-2 text-gray-300">
//                 📍 {place.distance_km} km away
//               </p>

//               <button
//                 onClick={() =>
//                   window.open(
//                     `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`,
//                     "_blank"
//                   )
//                 }
//                 className="mt-5 w-full bg-gradient-to-r from-[#C6A96E] to-[#A67C3D] text-black py-2 rounded-lg font-medium hover:opacity-90 transition"
//               >
//                 Get Directions
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

"use client";

export default function UnderProgress() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .page {
          min-height: 100dvh;
          background: #1a1210;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: 'DM Sans', sans-serif;
          gap: 16px;
          padding: 24px;
        }

        .title {
          font-size: 22px;
          font-weight: 400;
          color: #ffffff;
          letter-spacing: 0.02em;
        }

        .sub {
          font-size: 13px;
          font-weight: 300;
          color: rgba(255,255,255,0.4);
          letter-spacing: 0.04em;
          text-align: center;
        }

        .badge {
          margin-top: 8px;
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 4px;
          padding: 5px 12px;
        }
      `}</style>

      <div className="page">
        <span className="title">Feature Under Progress</span>
        <span className="sub">We&apos;re working on something great. Check back soon.</span>
      </div>
    </>
  );
}