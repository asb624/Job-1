import { storage } from "../server/storage";

async function main() {
  try {
    console.log("Creating sample users...");

    // Add sample users
    const users = [
      {
        username: "johndoe",
        password: "password123",
        avatar: "https://i.pravatar.cc/150?u=johndoe",
      },
      {
        username: "janedoe",
        password: "password123",
        avatar: "https://i.pravatar.cc/150?u=janedoe",
      },
      {
        username: "samsmith",
        password: "password123",
        avatar: "https://i.pravatar.cc/150?u=samsmith",
      },
    ];

    for (const userData of users) {
      try {
        const user = await storage.createUser(userData);
        console.log(`Created user: ${user.username} with ID: ${user.id}`);
        
        // Add a profile for each user
        await storage.updateProfile(user.id, {
          fullName: userData.username,
          phone: "1234567890",
          address: "123 Main St",
          bio: `I am ${userData.username}, a professional on Job Bazaar.`,
          languages: ["English", "Hindi"],
          skills: ["Communication", "Problem Solving"],
          verificationStatus: "verified",
          latitude: 20 + Math.random() * 10,
          longitude: 77 + Math.random() * 10,
        });
        console.log(`Created profile for user: ${user.username}`);
      } catch (error) {
        console.error(`Error creating user ${userData.username}:`, error);
      }
    }

    console.log("Sample users created successfully!");
  } catch (error) {
    console.error("Error creating sample users:", error);
  }
}

main().catch(console.error);