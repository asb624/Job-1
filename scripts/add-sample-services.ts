// Sample services script
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { serviceCategories, services, InsertUser, users } from '../shared/schema';

// Connect to the database
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

// Sample service data
const sampleServices = [
  {
    title: "House Cleaning Service",
    description: "Professional house cleaning services for all types of homes. Available for weekly, bi-weekly, or monthly services.",
    category: "Household Work",
    price: 1500,
    address: "123 Gandhi Road",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    postalCode: "400001",
    latitude: 19.0760,
    longitude: 72.8777,
    serviceRadius: 15,
    isRemote: false
  },
  {
    title: "Garden Maintenance",
    description: "Expert gardening services including planting, pruning, weeding, and lawn mowing. Making your garden beautiful all year round.",
    category: "Household Work",
    price: 1200,
    address: "45 Nehru Street",
    city: "Delhi",
    state: "Delhi",
    country: "India",
    postalCode: "110001",
    latitude: 28.6139,
    longitude: 77.2090,
    serviceRadius: 10,
    isRemote: false
  },
  {
    title: "Plumbing Services",
    description: "Reliable plumbing services for repairs, installations, and maintenance. Available 24/7 for emergencies.",
    category: "Household Work",
    price: 800,
    address: "78 Lake Road",
    city: "Bangalore",
    state: "Karnataka",
    country: "India",
    postalCode: "560001",
    latitude: 12.9716,
    longitude: 77.5946,
    serviceRadius: 20,
    isRemote: false
  },
  {
    title: "Crop Harvesting Help",
    description: "Experienced farm laborers available for crop harvesting season. Skilled in various crops including rice, wheat, and vegetables.",
    category: "Agriculture",
    price: 700,
    address: "Rural Extension Area",
    city: "Amritsar",
    state: "Punjab",
    country: "India",
    postalCode: "143001",
    latitude: 31.6340,
    longitude: 74.8723,
    serviceRadius: 30,
    isRemote: false
  },
  {
    title: "Cashier for Retail Store",
    description: "Experienced cashier available for retail stores. Proficient in handling cash, card payments, and basic inventory management.",
    category: "Shop Staff",
    price: 1000,
    address: "15 Market Street",
    city: "Jaipur",
    state: "Rajasthan",
    country: "India",
    postalCode: "302001",
    latitude: 26.9124,
    longitude: 75.7873,
    serviceRadius: 10,
    isRemote: false
  },
  {
    title: "Hair Styling and Cutting",
    description: "Professional hair stylist offering cutting, styling, coloring, and treatment services. Experienced with all hair types.",
    category: "Salon Service",
    price: 500,
    address: "Beauty Lane 5",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    postalCode: "600001",
    latitude: 13.0827,
    longitude: 80.2707,
    serviceRadius: 15,
    isRemote: false
  },
  {
    title: "Home Nursing Care",
    description: "Certified nurse providing home care services for elderly and patients recovering from surgery or illness. Medication management, vital signs monitoring, and basic medical care.",
    category: "Medical Staff",
    price: 2000,
    address: "Healthcare Avenue",
    city: "Hyderabad",
    state: "Telangana",
    country: "India",
    postalCode: "500001",
    latitude: 17.3850,
    longitude: 78.4867,
    serviceRadius: 25,
    isRemote: false
  },
  {
    title: "Cooking and Meal Preparation",
    description: "Experienced cook offering meal preparation services. Can prepare various Indian cuisines including North Indian, South Indian, and regional specialties.",
    category: "Household Work",
    price: 1300,
    address: "Food Street 10",
    city: "Kolkata",
    state: "West Bengal",
    country: "India",
    postalCode: "700001",
    latitude: 22.5726,
    longitude: 88.3639,
    serviceRadius: 12,
    isRemote: false
  },
  {
    title: "Farm Equipment Operator",
    description: "Skilled operator for tractors and various farm machinery. Experienced in plowing, sowing, and harvesting operations.",
    category: "Agriculture",
    price: 900,
    address: "Farm Road 7",
    city: "Ludhiana",
    state: "Punjab",
    country: "India",
    postalCode: "141001",
    latitude: 30.9010,
    longitude: 75.8573,
    serviceRadius: 40,
    isRemote: false
  },
  {
    title: "Sales Associate for Clothing Store",
    description: "Friendly and experienced sales associate for clothing retail. Knowledgeable about fashion trends and customer service.",
    category: "Shop Staff",
    price: 950,
    address: "Fashion Mall, 3rd Floor",
    city: "Pune",
    state: "Maharashtra",
    country: "India",
    postalCode: "411001",
    latitude: 18.5204,
    longitude: 73.8567,
    serviceRadius: 10,
    isRemote: false
  },
  {
    title: "Manicure and Pedicure Service",
    description: "Professional nail technician offering manicure, pedicure, and nail art services. Using quality products for long-lasting results.",
    category: "Salon Service",
    price: 600,
    address: "Beauty Center 12",
    city: "Ahmedabad",
    state: "Gujarat",
    country: "India",
    postalCode: "380001",
    latitude: 23.0225,
    longitude: 72.5714,
    serviceRadius: 15,
    isRemote: false
  },
  {
    title: "Pharmacy Assistant",
    description: "Trained pharmacy assistant available for medication dispensing, inventory management, and customer service in pharmacies.",
    category: "Medical Staff",
    price: 1100,
    address: "Health Street 5",
    city: "Lucknow",
    state: "Uttar Pradesh",
    country: "India",
    postalCode: "226001",
    latitude: 26.8467,
    longitude: 80.9462,
    serviceRadius: 20,
    isRemote: false
  },
  {
    title: "Electrical Repairs and Installation",
    description: "Licensed electrician for all electrical repairs, installations, and maintenance work. Residential and commercial services available.",
    category: "Household Work",
    price: 1000,
    address: "Power Lane 9",
    city: "Surat",
    state: "Gujarat",
    country: "India",
    postalCode: "395001",
    latitude: 21.1702,
    longitude: 72.8311,
    serviceRadius: 25,
    isRemote: false
  },
  {
    title: "Irrigation System Installation",
    description: "Expert in designing and installing efficient irrigation systems for farms and gardens. Specializing in drip irrigation and sprinkler systems.",
    category: "Agriculture",
    price: 1800,
    address: "Water Works Road",
    city: "Nagpur",
    state: "Maharashtra",
    country: "India",
    postalCode: "440001",
    latitude: 21.1458,
    longitude: 79.0882,
    serviceRadius: 35,
    isRemote: false
  },
  {
    title: "Grocery Store Shelf Stocker",
    description: "Efficient worker for stocking grocery store shelves, organizing products, and maintaining inventory. Available for day or night shifts.",
    category: "Shop Staff",
    price: 850,
    address: "Market Complex 3",
    city: "Bhopal",
    state: "Madhya Pradesh",
    country: "India",
    postalCode: "462001",
    latitude: 23.2599,
    longitude: 77.4126,
    serviceRadius: 15,
    isRemote: false
  },
  {
    title: "Makeup Artist for Events",
    description: "Professional makeup artist for weddings, parties, and special events. Specializing in bridal makeup and various makeup styles.",
    category: "Salon Service",
    price: 2500,
    address: "Glamour Street 7",
    city: "Chandigarh",
    state: "Punjab",
    country: "India",
    postalCode: "160001",
    latitude: 30.7333,
    longitude: 76.7794,
    serviceRadius: 30,
    isRemote: true
  },
  {
    title: "Medical Lab Technician",
    description: "Certified lab technician for blood collection, sample processing, and basic medical tests. Available for home visits or clinic work.",
    category: "Medical Staff",
    price: 1200,
    address: "Healthcare Plaza",
    city: "Indore",
    state: "Madhya Pradesh",
    country: "India",
    postalCode: "452001",
    latitude: 22.7196,
    longitude: 75.8577,
    serviceRadius: 20,
    isRemote: false
  },
  {
    title: "Carpentry and Furniture Repair",
    description: "Skilled carpenter offering furniture making, repair, and woodworking services. Custom designs and quality craftsmanship.",
    category: "Household Work",
    price: 1100,
    address: "Woodwork Lane 4",
    city: "Kochi",
    state: "Kerala",
    country: "India",
    postalCode: "682001",
    latitude: 9.9312,
    longitude: 76.2673,
    serviceRadius: 20,
    isRemote: false
  },
  {
    title: "Pesticide Application Service",
    description: "Safe and effective pesticide application for farms and orchards. Using environmentally friendly methods when possible.",
    category: "Agriculture",
    price: 1500,
    address: "Green Fields Road",
    city: "Coimbatore",
    state: "Tamil Nadu",
    country: "India",
    postalCode: "641001",
    latitude: 11.0168,
    longitude: 76.9558,
    serviceRadius: 50,
    isRemote: false
  },
  {
    title: "Warehouse Stock Manager",
    description: "Experienced in warehouse management, inventory control, and logistics. Proficient with inventory management software.",
    category: "Shop Staff",
    price: 1400,
    address: "Industrial Area 5",
    city: "Guwahati",
    state: "Assam",
    country: "India",
    postalCode: "781001",
    latitude: 26.1445,
    longitude: 91.7362,
    serviceRadius: 25,
    isRemote: false
  }
];

async function main() {
  try {
    // Get existing users
    const userList = await db.select().from(users);
    
    if (userList.length === 0) {
      console.log('No users found. Please create users first.');
      return;
    }
    
    // Use the first user as provider for all sample services
    const providerId = userList[0].id;
    
    // Insert sample services
    console.log(`Adding 20 sample services with provider ID: ${providerId}`);
    
    for (const service of sampleServices) {
      await db.insert(services).values({
        ...service,
        providerId
      });
    }
    
    console.log('Successfully added 20 sample services!');
  } catch (error) {
    console.error('Error adding sample services:', error);
  } finally {
    await client.end();
  }
}

main();