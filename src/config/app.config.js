/**
 * Pick My Travels - Global Configuration File
 * Contains all site settings, database driver configurations, connection strings,
 * default seed data, and WhatsApp integration rules.
 */


export const APP_CONFIG = {
  // Brand & Company Global Variables
  COMPANY_NAME: "Pick My Travels",
  TAGLINE: "Your Trusted Travel Partner in Odisha & Beyond",
  TOLL_FREE: "9853706020",
  WHATSAPP_NUMBER: "9853706020",
  DISPLAY_WHATSAPP: "+91 9853706020",
  EMAIL: "info@pickmytravels.com",
  SUPPORT_EMAIL: "pickmytravelsbbsr@gmail.com",
  ADDRESS: "In front of DIC Office, Near Esplanade Exit Gate, Rasulgarh Industrial Estate, Bhubaneswar - 751010, Odisha",
  CURRENCY: "₹",
  COUPON_CODE: "PICK500",
  COUPON_DISCOUNT: 500,

  // Data is persisted through the secured Neon Postgres API.
  ACTIVE_DB_DRIVER: "POSTGRES",

  // Social Links
  SOCIAL: {
    FACEBOOK: "https://www.facebook.com/PICKMYTRAVELS/",
    TWITTER: "https://twitter.com/patratravels",
    INSTAGRAM: "https://www.instagram.com/pick_my_travels",
    YOUTUBE: "https://www.pickmytravels.com/",
    LINKEDIN: "https://www.pickmytravels.com/"
  },

  GOOGLE_REVIEWS: {
    RATING: 4.8,
    COUNT: 116,
    MAPS_URL: "https://www.google.com/maps/search/?api=1&query=PICK+MY+TRAVELS+Rasulgarh+Bhubaneswar",
    REVIEWS: [
      {
        id: "gr-1",
        text: "Very good service and genuine price",
        rating: 4,
        date: "Oct 2025"
      },
      {
        id: "gr-2",
        text: "Very good service and politely driver",
        rating: 4,
        date: "Jul 2025"
      },
      {
        id: "gr-3",
        text: "Vehicle in excellent condition and driver was very experienced and well behaved.",
        rating: 5,
        date: "Jul 2024"
      },
      {
        id: "gr-4",
        text: "Super service and good behaviour driver",
        rating: 5,
        date: "Feb 2024"
      },
      {
        id: "gr-5",
        text: "Exlent service and well maintained car,very low prices",
        rating: 5,
        date: "Mar 2022"
      },
      {
        id: "gr-6",
        text: "Nice travel agency in Bhubaneswar, great pricing and packege. Thank you pick my tarvel for the great trips.",
        rating: 5,
        date: "Dec 2020"
      },
      {
        id: "gr-7",
        text: "Driver was very professional and well known with the locality. Fare was also very reasonable.. Atlest one can make a halt anywhere in between the journey which is not available in OLA or UBER in that area... Pretty good experience.",
        rating: 5,
        date: "Dec 2020"
      }
    ]
  },

  // Default Seed Data
  DEFAULT_CARS: [
    {
      id: "CAR-101",
      name: "Swift Dzire / Etios",
      category: "Sedan",
      seater: 4,
      hourlyPrice: 250, // ₹ per hour
      perKmPrice: 12,
      fourHours40Km: 1600,
      eightHours80Km: 2200,
      tenHours100Km: 2500,
      extraHour: 120,
      extraKm: 13,
      ac: true,
      
      image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80",
      features: ["Air Conditioner", "Music System", "Clean Interiors", "24/7 Support"]
    },
    {
      id: "CAR-102",
      name: "Ertiga / Triber",
      category: "Compact SUV",
      seater: 6,
      hourlyPrice: 350,
      perKmPrice: 16,
      fourHours40Km: 2500,
      eightHours80Km: 3000,
      tenHours100Km: 3500,
      extraHour: 150,
      extraKm: 15,
      ac: true,
      image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&auto=format&fit=crop&q=80",
      features: ["Spacious Seating", "AC Front & Rear", "Comfortable Legs", "Luggage Carrier"]
    },
    {
      id: "CAR-103",
      name: "Innova Crysta",
      category: "Luxury SUV",
      seater: 7,
      hourlyPrice: 500,
      perKmPrice: 22,
      fourHours40Km: 3500,
      eightHours80Km: 4000,
      tenHours100Km: 4500,
      extraHour: 200,
      extraKm: 20,
      ac: true,
      image: "https://images.unsplash.com/photo-1563720223185-11003d516935?w=600&auto=format&fit=crop&q=80",
      features: ["Premium Leather Seats", "Dual AC", "Push Back Seats", "Experienced Driver"]
    },
    {
      id: "CAR-104",
      name: "Force Tempo Traveller",
      category: "Mini Van",
      seater: 12,
      hourlyPrice: 750,
      perKmPrice: 28,
      ac: true,
      image: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=600&auto=format&fit=crop&q=80",
      features: ["High Roof", "Reclining Seats", "LED Screen & Stereo", "Ample Boot Space"]
    },
    {
      id: "CAR-105",
      name: "Luxury Urbania",
      category: "Executive Van",
      seater: 17,
      hourlyPrice: 1100,
      perKmPrice: 38,
      fourHours40Km: null,
      eightHours80Km: 12000,
      tenHours100Km: 13000,
      extraHour: 500,
      extraKm: 65,
      ac: true,
      image: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600&auto=format&fit=crop&q=80",
      features: ["Recliner Leather Seats", "Mood Lighting", "Individual USB Ports", "Super Smooth Ride"]
    },
    {
      id: "CAR-106",
      name: "Audi A6 / Mercedes E-Class",
      category: "VIP Luxury",
      seater: 4,
      hourlyPrice: 1500,
      perKmPrice: 65,
      ac: true,
      image: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=600&auto=format&fit=crop&q=80",
      features: ["VIP Chauffeur", "Panoramic Sunroof", "Bottled Water & Snacks", "Chilled AC"]
    },
    {
      id: "CAR-107",
      name: "Mini Bus / Coach",
      category: "Bus",
      seater: 26,
      hourlyPrice: 1400,
      perKmPrice: 45,
      ac: true,
      image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80",
      features: ["Ideal for Group Tours", "Sound System", "Air Suspension", "Experienced Driver"]
    },
    {
      id: "CAR-108",
      name: "Deluxe Coach Bus",
      category: "Bus",
      seater: 44,
      hourlyPrice: 2200,
      perKmPrice: 65,
      ac: true,
      image: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=600&auto=format&fit=crop&q=80",
      features: ["44 Luxury Pushback Seats", "PA System", "Wide Windows", "Wedding / Tour Special"]
    }
  ],

  // DEFAULT_BLOGS: [
  //   {
  //     id: 1,
  //     title: "Top 10 Hidden Gems in Bhubaneswar You Must Visit in 2026",
  //     category: "Travel Guide",
  //     author: "Patra Editorial Team",
  //     date: "Sep 25, 2026",
  //     readTime: "5 min read",
  //     image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80",
  //     excerpt: "Explore the ancient temple architecture, tranquil parks, and rich heritage locations around the Smart City Bhubaneswar.",
  //     content: "Bhubaneswar, the Temple City of India, is famous for Lingaraj Temple and Dhauli Giri. However, lesser known spots like Bindusagar Lake ghats, Ekamra Kanan Botanical Gardens, and Mukteshwar temple precinct offer rich serenity."
  //   },
  //   {
  //     id: 2,
  //     title: "Puri Jagannath Temple Pilgrimage & Car Rental Guide",
  //     category: "Pilgrimage",
  //     author: "Sunil Patra",
  //     date: "Sep 20, 2026",
  //     readTime: "7 min read",
  //     image: "https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?w=600&auto=format&fit=crop&q=80",
  //     excerpt: "Essential tips for hassle-free one-day & round trips from Bhubaneswar Airport to Lord Jagannath Dham Puri.",
  //     content: "Planning a spiritual visit to Puri? Book a round-trip taxi with Patra Travels to enjoy smooth highway navigation via NH-316, stopover at Pipli applique village, and reach Puri Jagannath temple stress-free."
  //   },
  //   {
  //     id: 3,
  //     title: "Chilika Lake Tour: Irrawaddy Dolphins & Bird Watching",
  //     category: "Eco Tourism",
  //     author: "Rutu Panigrahi",
  //     date: "Sep 18, 2026",
  //     readTime: "6 min read",
  //     image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80",
  //     excerpt: "Witness Asia's largest brackish water lagoon at Satapada & Mangalajodi with our customized day taxi packages.",
  //     content: "Chilika Lake is home to rare Irrawaddy dolphins and thousands of migratory birds during winter. Our 12-seater Tempo Travellers & Innova Cabs make group day trips comfortable."
  //   },
  //   {
  //     id: 4,
  //     title: "Konark Sun Temple & Marine Drive Road Trip Experience",
  //     category: "Heritage",
  //     author: "Anita Dash",
  //     date: "Sep 12, 2026",
  //     readTime: "4 min read",
  //     image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80",
  //     excerpt: "Drive down the scenic Puri-Konark Marine Drive with breeze and ocean views in a cozy AC sedan.",
  //     content: "The Puri to Konark coastline road trip is famous across India. Stop at Chandrabhaga Beach, visit the 13th-century UNESCO World Heritage Sun Temple, and sample local street snacks."
  //   },
  //   {
  //     id: 5,
  //     title: "Airport Transfer Tips: Biju Patnaik International Airport",
  //     category: "Travel Tips",
  //     author: "Patra Editorial Team",
  //     date: "Sep 08, 2026",
  //     readTime: "3 min read",
  //     image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&auto=format&fit=crop&q=80",
  //     excerpt: "Why pre-booking your airport pickup and drop taxi saves time and eliminates surge pricing stress.",
  //     content: "Avoid waiting in long taxi queues at Bhubaneswar Airport (BPI). With Patra Travels pre-booked airport transfers, your professional driver waits at the arrival terminal with a personalized name card."
  //   },
  //   {
  //     id: 6,
  //     title: "How to Choose the Right Seater Vehicle for Group Trips",
  //     category: "Fleet Insights",
  //     author: "Rajesh Mohanty",
  //     date: "Aug 30, 2026",
  //     readTime: "5 min read",
  //     image: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=600&auto=format&fit=crop&q=80",
  //     excerpt: "From 4-seater Swift Dzire to 26-seater luxury coaches, select the best vehicle based on luggage and passenger counts.",
  //     content: "When traveling with family or colleagues, calculating legroom, luggage space, and AC comfort is crucial. Check out our quick seater recommendation matrix."
  //   },
  //   {
  //     id: 7,
  //     title: "Golden Triangle of Odisha: Bhubaneswar, Puri & Konark",
  //     category: "Tour Package",
  //     author: "Sunil Patra",
  //     date: "Aug 22, 2026",
  //     readTime: "8 min read",
  //     image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&auto=format&fit=crop&q=80",
  //     excerpt: "Complete 3-day itinerary covering Odisha's iconic cultural, historical, and spiritual circuit.",
  //     content: "Discover temples, coastal breezes, world-famous handicrafts, and authentic Odia cuisine with Patra Travels dedicated driver cum local guide package."
  //   },
  //   {
  //     id: 8,
  //     title: "Corporate Car Rentals: Streamlining Business Mobility",
  //     category: "Corporate Travel",
  //     author: "Patra Editorial Team",
  //     date: "Aug 15, 2026",
  //     readTime: "4 min read",
  //     image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80",
  //     excerpt: "Monthly corporate car rental solutions, executive sedans, and GST compliant billing for IT & government firms.",
  //     content: "Patra Travels serves over 100+ corporate clients across Bhubaneswar, Cuttack, and Rourkela with luxury Innova Crystas, Mercedes sedans, and punctual chauffeurs."
  //   },
  //   {
  //     id: 9,
  //     title: "Simlipal National Park Wildlife Safari & Taxi Guide",
  //     category: "Adventure",
  //     author: "Deepak Sahu",
  //     date: "Aug 10, 2026",
  //     readTime: "6 min read",
  //     image: "https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=600&auto=format&fit=crop&q=80",
  //     excerpt: "Journey to Mayurbhanj's lush forests, Barehipani waterfalls, and tiger reserve with reliable outstation SUVs.",
  //     content: "Simlipal Tiger Reserve is a paradise for nature enthusiasts. Hiring a sturdy SUV like Innova or Scorpio ensures comfortable navigation over hilly forest terrains."
  //   },
  //   {
  //     id: 10,
  //     title: "Gopalpur-on-Sea: Peaceful Coastal Retreat from Bhubaneswar",
  //     category: "Weekend Gateway",
  //     author: "Anita Dash",
  //     date: "Aug 02, 2026",
  //     readTime: "5 min read",
  //     image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80",
  //     excerpt: "Unwind at Gopalpur beach, Tampara lake boating, and Berhampur street food spots with our weekend outstation cabs.",
  //     content: "Located just 170 km from Bhubaneswar, Gopalpur offers pristine quiet beaches, colonial lighthouses, and delicious sea food delicacies."
  //   },
  //   {
  //     id: 11,
  //     title: "Wedding & Event Transport Fleet: Luxury Cars & Buses",
  //     category: "Events",
  //     author: "Patra Event Desk",
  //     date: "Jul 28, 2026",
  //     readTime: "4 min read",
  //     image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&auto=format&fit=crop&q=80",
  //     excerpt: "Coordinate Baraat entries, guest pickup fleets, and bride/groom VIP luxury cars for grand Odia weddings.",
  //     content: "Make your special day seamless with our fleet of 44-seater luxury buses for wedding guests and Audi / BMW luxury sedans decorated for wedding couples."
  //   },
  //   {
  //     id: 12,
  //     title: "Night Travel Safety & 24/7 Roadside Assistance",
  //     category: "Safety First",
  //     author: "Patra Fleet Manager",
  //     date: "Jul 20, 2026",
  //     readTime: "4 min read",
  //     image: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&auto=format&fit=crop&q=80",
  //     excerpt: "How our GPS-tracked vehicles, verified drivers, and emergency response desk protect night travelers.",
  //     content: "Safety is our topmost priority. All Patra Travels taxis undergo mandatory multi-point safety checks, speed governor checks, and real-time GPS tracking."
  //   }
  // ],

  // WhatsApp Helper Function
  getWhatsappLink: (messageText) => {
    const encoded = encodeURIComponent(messageText || "Hello PickMyTravels, I would like to inquire about taxi booking.");
    return `https://wa.me/${APP_CONFIG.WHATSAPP_NUMBER}?text=${encoded}`;
  }
};
