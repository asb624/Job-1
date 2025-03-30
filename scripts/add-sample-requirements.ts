import { storage } from "../server/storage";
import { serviceCategories } from "../shared/schema";

async function main() {
  try {
    console.log("Adding sample requirements...");
    
    // Get the existing users
    const user1 = await storage.getUserByUsername("johndoe");
    const user2 = await storage.getUserByUsername("janedoe");
    
    if (!user1 || !user2) {
      console.error("Required users not found. Please run add-sample-users.ts first.");
      return;
    }
    
    // Add sample requirements
    const requirements = [
      {
        userId: user1.id,
        title: "Need a professional plumber",
        description: "Looking for a skilled plumber to fix a leaking pipe in my bathroom.",
        budget: 500,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        category: serviceCategories[1], // Assuming second item is plumbing
        locationName: "Mumbai, Maharashtra",
        latitude: 19.0760,
        longitude: 72.8777,
        isRemote: false,
        status: "active"
      },
      {
        userId: user2.id,
        title: "Website developer needed",
        description: "Looking for an experienced web developer to create a portfolio website.",
        budget: 10000,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        category: serviceCategories[3], // Assuming fourth item is web development
        locationName: "Bangalore, Karnataka",
        latitude: 12.9716,
        longitude: 77.5946,
        isRemote: true,
        status: "active"
      },
      {
        userId: user1.id,
        title: "House painting service",
        description: "Need someone to paint my 2BHK apartment with quality materials.",
        budget: 15000,
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        category: serviceCategories[2], // Assuming third item is painting
        locationName: "Delhi, NCR",
        latitude: 28.7041,
        longitude: 77.1025,
        isRemote: false,
        status: "active"
      }
    ];
    
    for (const req of requirements) {
      const createdRequirement = await storage.createRequirement(req);
      console.log(`Created requirement: ${createdRequirement.title} with ID: ${createdRequirement.id}`);
    }
    
    console.log("Sample requirements added successfully!");
  } catch (error) {
    console.error("Error adding sample requirements:", error);
  }
}

main().catch(console.error);