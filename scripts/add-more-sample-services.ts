import { storage } from "../server/storage";
import { serviceCategories } from "../shared/schema";

async function main() {
  try {
    console.log("Adding diverse sample services...");
    
    // Get user IDs for the service providers
    const users = await Promise.all([
      storage.getUserByUsername("johndoe"),
      storage.getUserByUsername("janedoe"),
      storage.getUserByUsername("samsmith")
    ]);
    
    if (users.some(user => !user)) {
      console.error("Some users not found. Please run add-sample-users.ts first.");
      return;
    }
    
    const serviceData = [
      {
        providerId: users[0]!.id,
        title: "Professional Plumbing Services",
        description: "Expert plumbing services for home and commercial buildings. Available 24/7 for emergencies.",
        price: 500,
        category: "Plumbing",
        locationName: "Mumbai, Maharashtra",
        latitude: 19.0760,
        longitude: 72.8777,
        isRemote: false,
        images: ["https://images.unsplash.com/photo-1558618666-c891e0bf0fbe?w=800&auto=format&fit=crop"]
      },
      {
        providerId: users[1]!.id,
        title: "Web Development and Design",
        description: "Custom website development using modern frameworks. Responsive design, SEO optimization, and maintenance included.",
        price: 15000,
        category: "Web Development",
        locationName: "Bangalore, Karnataka",
        latitude: 12.9716,
        longitude: 77.5946,
        isRemote: true,
        images: ["https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=800&auto=format&fit=crop"]
      },
      {
        providerId: users[2]!.id,
        title: "Professional House Painting",
        description: "Quality house painting services with premium materials. Interior and exterior painting available.",
        price: 12000,
        category: "Painting",
        locationName: "Delhi, NCR",
        latitude: 28.7041,
        longitude: 77.1025,
        isRemote: false,
        images: ["https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=800&auto=format&fit=crop"]
      },
      {
        providerId: users[0]!.id,
        title: "Carpentry and Furniture Repair",
        description: "Custom carpentry and furniture repair services. From simple fixes to custom-built furniture.",
        price: 800,
        category: "Carpentry",
        locationName: "Hyderabad, Telangana",
        latitude: 17.3850,
        longitude: 78.4867,
        isRemote: false,
        images: ["https://images.unsplash.com/photo-1622021142947-da7dedc7c39a?w=800&auto=format&fit=crop"]
      },
      {
        providerId: users[1]!.id,
        title: "Electrical Installation and Repair",
        description: "Licensed electrician providing safe and reliable electrical services for residential and commercial properties.",
        price: 700,
        category: "Electrical",
        locationName: "Chennai, Tamil Nadu",
        latitude: 13.0827,
        longitude: 80.2707,
        isRemote: false,
        images: ["https://images.unsplash.com/photo-1621905251189-08b45249be55?w=800&auto=format&fit=crop"]
      },
      {
        providerId: users[2]!.id,
        title: "Digital Marketing Strategy",
        description: "Comprehensive digital marketing services including SEO, content marketing, social media, and PPC campaigns.",
        price: 8000,
        category: "Marketing",
        locationName: "Pune, Maharashtra",
        latitude: 18.5204,
        longitude: 73.8567,
        isRemote: true,
        images: ["https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop"]
      }
    ];
    
    for (const service of serviceData) {
      try {
        const createdService = await storage.createService(service);
        console.log(`Created service: ${createdService.title} with ID: ${createdService.id}`);
      } catch (error) {
        console.error(`Failed to create service "${service.title}":`, error);
      }
    }
    
    console.log("Sample services added successfully!");
  } catch (error) {
    console.error("Error adding sample services:", error);
  }
}

main().catch(console.error);