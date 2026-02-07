import "dotenv/config";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

async function seed() {
  const connection = await mysql.createConnection(DATABASE_URL);

  console.log("Seeding forum categories...");

  const categories = [
    { name: "TG/TF Transformations", slug: "tg-tf-transformations", description: "Discuss male-to-female, female-to-male, and other transformation stories, art, and experiences.", icon: "✨", sortOrder: 1 },
    { name: "Crossdressing Tips", slug: "crossdressing-tips", description: "Share and discover tips on clothing, wigs, makeup, and passing. All experience levels welcome.", icon: "👗", sortOrder: 2 },
    { name: "Femboy Style", slug: "femboy-style", description: "Fashion inspiration, outfit ideas, and style guides for the femboy community.", icon: "💜", sortOrder: 3 },
    { name: "Makeup & Beauty", slug: "makeup-beauty", description: "Tutorials, product reviews, and techniques for feminization makeup and beauty routines.", icon: "💄", sortOrder: 4 },
    { name: "Stories & Fiction", slug: "stories-fiction", description: "Share your original TG/TF stories, fan fiction, and creative writing.", icon: "📖", sortOrder: 5 },
    { name: "AI & Technology", slug: "ai-technology", description: "Discuss AI-generated transformation content, tools, and techniques.", icon: "🤖", sortOrder: 6 },
    { name: "Support & Advice", slug: "support-advice", description: "A safe space for questions, coming out stories, and emotional support.", icon: "💚", sortOrder: 7 },
    { name: "Off-Topic", slug: "off-topic", description: "General chat, introductions, and anything that doesn't fit other categories.", icon: "💬", sortOrder: 8 },
  ];

  for (const cat of categories) {
    await connection.execute(
      `INSERT INTO forum_categories (name, slug, description, icon, sortOrder, isActive) 
       VALUES (?, ?, ?, ?, ?, true) 
       ON DUPLICATE KEY UPDATE description = VALUES(description), icon = VALUES(icon), sortOrder = VALUES(sortOrder)`,
      [cat.name, cat.slug, cat.description, cat.icon, cat.sortOrder]
    );
    console.log(`  ✓ ${cat.name}`);
  }

  // Get category IDs
  const [catRows] = await connection.execute("SELECT id, slug FROM forum_categories");
  const catMap = {};
  for (const row of catRows) {
    catMap[row.slug] = row.id;
  }

  // Check if we have a system user for seed posts
  const [userRows] = await connection.execute("SELECT id FROM users LIMIT 1");
  let authorId;
  if (userRows.length > 0) {
    authorId = userRows[0].id;
  } else {
    console.log("No users found, skipping sample topics.");
    await connection.end();
    console.log("\n✅ Forum categories seeded successfully!");
    return;
  }

  console.log("\nSeeding sample topics...");

  const topics = [
    {
      categorySlug: "tg-tf-transformations",
      title: "Welcome to TG/TF Transformations! Share your favorite stories",
      content: "Welcome to the TG/TF Transformations category! This is the place to discuss all things related to gender transformation content.\n\n**What you can share here:**\n- Your favorite TG/TF stories and videos\n- Recommendations for new content\n- Discussion about transformation tropes and themes\n- Your own transformation journey experiences\n\nPlease be respectful and follow community guidelines. Let's build an amazing community together! 🌟",
      isPinned: true,
    },
    {
      categorySlug: "crossdressing-tips",
      title: "Beginner's Guide: Essential Tips for Starting Your Crossdressing Journey",
      content: "Hey everyone! I've been crossdressing for 5 years now and wanted to share some tips for beginners:\n\n**1. Start with basics**\nDon't try to do everything at once. Start with simple outfits and build up.\n\n**2. Invest in a good wig**\nA quality wig makes a huge difference. Lace front wigs look the most natural.\n\n**3. Learn basic makeup**\nFoundation, concealer, and lipstick go a long way. YouTube tutorials are your best friend.\n\n**4. Find your size**\nWomen's sizing is different. Measure yourself and use size charts.\n\n**5. Be patient with yourself**\nIt takes time to develop your style. Enjoy the journey!\n\nFeel free to ask any questions below! 💕",
      isPinned: true,
    },
    {
      categorySlug: "femboy-style",
      title: "Spring 2026 Femboy Fashion Trends 🌸",
      content: "Spring is here and I'm excited about the new trends! Here are my picks:\n\n- **Pastel oversized hoodies** - comfy and cute\n- **Pleated mini skirts** with thigh-highs\n- **Platform sneakers** - adds height and style\n- **Crop tops with high-waisted jeans** - classic combo\n- **Chokers and layered necklaces** - accessories make the outfit\n\nWhat are you planning to wear this spring? Share your outfit ideas! 🌈",
      isPinned: false,
    },
    {
      categorySlug: "makeup-beauty",
      title: "My Feminization Makeup Routine (Step by Step with Photos)",
      content: "After months of practice, I finally have a routine that works! Here's my step-by-step:\n\n1. **Primer** - Smooths skin and helps makeup last\n2. **Color corrector** - Orange/peach for beard shadow\n3. **Foundation** - Full coverage, matched to neck\n4. **Concealer** - Under eyes and blemishes\n5. **Contour** - Jawline, nose, forehead\n6. **Highlight** - Cheekbones, nose bridge, cupid's bow\n7. **Blush** - Apples of cheeks\n8. **Eyes** - Primer, shadow, liner, mascara\n9. **Lips** - Liner + lipstick + gloss\n10. **Setting spray** - Lock it all in!\n\nTotal time: about 45 minutes. What's your routine like?",
      isPinned: false,
    },
    {
      categorySlug: "ai-technology",
      title: "Best AI Tools for TG/TF Content Creation in 2026",
      content: "AI has revolutionized how we create transformation content. Here are the best tools I've found:\n\n**Video Generation:**\n- Hailuo AI (MiniMax) - Great for short transformation clips\n- VEO 3 - Highest quality but slower\n- WAN 2.6 - Good balance of speed and quality\n\n**Image Generation:**\n- Flux - Best for realistic transformations\n- DALL-E 4 - Good for artistic styles\n\n**Story Writing:**\n- Claude - Best for creative fiction\n- GPT-5 - Good for plot development\n\nWhat tools are you using? Any hidden gems to share?",
      isPinned: false,
    },
    {
      categorySlug: "support-advice",
      title: "Safe Space: Share Your Story 💚",
      content: "This is a judgment-free zone where you can share your experiences, ask for advice, or just vent.\n\n**Remember:**\n- Everyone's journey is different and valid\n- Be kind and supportive to each other\n- If you're struggling, you're not alone\n- Professional help is always recommended for serious concerns\n\nI'll start: I discovered my love for transformation content 3 years ago, and this community has been incredibly supportive. It helped me understand myself better and connect with people who share similar interests.\n\nYour turn! 💚",
      isPinned: true,
    },
    {
      categorySlug: "off-topic",
      title: "Introduce Yourself! 👋",
      content: "New to the community? Tell us about yourself!\n\n**Template:**\n- Name/nickname:\n- How you found us:\n- Your interests:\n- Favorite TG/TF content:\n- Fun fact about you:\n\nI'll go first:\n- Name: Community Admin\n- Found through: YouTube recommendations\n- Interests: AI art, transformation stories, fashion\n- Favorite content: Animated TG sequences\n- Fun fact: I can solve a Rubik's cube in under 2 minutes!\n\nWelcome to FEMSIDER! 🎉",
      isPinned: true,
    },
    {
      categorySlug: "stories-fiction",
      title: "Writing Contest: Best Short TG/TF Story (500 words max)",
      content: "Let's have a friendly writing contest! 📝\n\n**Rules:**\n- Maximum 500 words\n- Must include a transformation element\n- Keep it SFW (safe for work)\n- Post your story as a reply to this thread\n- Voting will be done through upvotes\n\n**Prize:** The winning story will be featured on the homepage and the author gets a verified badge!\n\n**Deadline:** End of the month\n\nGood luck to all participants! ✍️",
      isPinned: false,
    },
  ];

  for (const topic of topics) {
    const categoryId = catMap[topic.categorySlug];
    if (!categoryId) continue;

    const [existing] = await connection.execute(
      "SELECT id FROM forum_topics WHERE title = ? AND categoryId = ?",
      [topic.title, categoryId]
    );

    if (existing.length === 0) {
      await connection.execute(
        `INSERT INTO forum_topics (categoryId, authorId, title, content, isPinned, isLocked, viewCount, replyCount, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, false, ?, 0, NOW(), NOW())`,
        [categoryId, authorId, topic.title, topic.content, topic.isPinned, Math.floor(Math.random() * 200) + 10]
      );
      console.log(`  ✓ ${topic.title.substring(0, 50)}...`);
    } else {
      console.log(`  ⏭ ${topic.title.substring(0, 50)}... (already exists)`);
    }
  }

  await connection.end();
  console.log("\n✅ Forum seeded successfully!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
