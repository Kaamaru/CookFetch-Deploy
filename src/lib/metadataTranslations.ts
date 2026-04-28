export type MetadataLanguage = "en" | "th";

export function normalizeMetadataLanguage(input?: string): MetadataLanguage {
  return input === "th" ? "th" : "en";
}

const metadataTranslations = {
  en: {
    appTitleDefault:
      "CookFetch - Find Recipes From Ingredients You Already Have",
    appTitleTemplate: "%s | CookFetch",
    appDescription:
      "CookFetch is an AI-powered recipe finder and meal planner that helps you turn ingredients into delicious meals, track food inventory, and reduce food waste effortlessly.",
    appKeywords: [
      "recipe from ingredients",
      "what to cook with what I have",
      "AI recipe generator",
      "meal planner app",
      "food inventory tracker",
      "reduce food waste",
      "easy recipes",
      "cooking app",
      "smart kitchen app",
    ],
    openGraphTitle: "CookFetch - Smart Recipe Finder & Meal Planner",
    openGraphDescription:
      "Find recipes instantly from ingredients you already have. Plan meals smarter, track food expiry, and reduce waste with AI.",
    openGraphAlt: "CookFetch - AI Recipe Finder",
    twitterTitle: "CookFetch - AI Recipe Finder",
    twitterDescription:
      "Turn your ingredients into meals with AI. Discover recipes, plan meals, and reduce food waste.",
    authorName: "CookFetch Team",
    appCreator: "CookFetch",
    appPublisher: "CookFetch",
    appSiteName: "CookFetch",
    twitterHandle: "@cookfetch",
    homeTitle: "Home - CookFetch",
    homeDescription:
      "CookFetch helps you reduce food waste with smart pantry tracking, recipe suggestions, and meal planning.",
    loginTitle: "Login - CookFetch",
    loginDescription:
      "Sign in to CookFetch to manage your foods, track expirations, and get personalized recipe recommendations.",
    assistantTitle: "AI Assistant - CookFetch",
    assistantDescription:
      "Use the CookFetch AI assistant to discover recipe ideas based on your available ingredients.",
    calendarTitle: "Calendar - CookFetch",
    calendarDescription:
      "View your food expiry timeline and meal planning schedule in the CookFetch calendar.",
    devicesTitle: "Devices - CookFetch",
    devicesDescription:
      "Connect and manage your smart kitchen hardware devices in CookFetch.",
    foodsTitle: "My Foods - CookFetch",
    foodsDescription:
      "Track your pantry and fridge inventory, monitor expiry dates, and reduce food waste with CookFetch.",
    groceryTitle: "Grocery - CookFetch",
    groceryDescription:
      "Build, organize, and convert grocery lists into scheduled meals with CookFetch.",
    profileTitle: "Profile - CookFetch",
    profileDescription:
      "Manage your CookFetch account details and personal preferences.",
    recipesTitle: "Recipes - CookFetch",
    recipesDescription:
      "Search recipes and generate meal ideas from your ingredients in CookFetch.",
    recipeDetailTitle: "Recipe Details - CookFetch",
    recipeDetailDescription:
      "View complete recipe details including ingredients and preparation steps on CookFetch.",
    settingsTitle: "Settings - CookFetch",
    settingsDescription:
      "Configure CookFetch app settings, preferences, and user experience options.",
  },
  th: {
    appTitleDefault: "CookFetch - ค้นหาสูตรจากวัตถุดิบที่คุณมี",
    appTitleTemplate: "%s | CookFetch",
    appDescription:
      "CookFetch คือผู้ช่วยค้นหาสูตรและวางแผนมื้ออาหารด้วย AI ที่ช่วยเปลี่ยนวัตถุดิบที่มีให้เป็นเมนูอร่อย ติดตามสต็อกอาหาร และลดการทิ้งอาหารอย่างง่ายดาย",
    appKeywords: [
      "สูตรอาหารจากวัตถุดิบ",
      "มีวัตถุดิบอะไรทำอะไรได้",
      "AI สร้างสูตรอาหาร",
      "แอปวางแผนมื้ออาหาร",
      "ติดตามสต็อกอาหาร",
      "ลดขยะอาหาร",
      "สูตรอาหารง่าย",
      "แอปทำอาหาร",
      "แอปครัวอัจฉริยะ",
    ],
    openGraphTitle: "CookFetch - ผู้ช่วยค้นหาสูตรและวางแผนมื้ออาหาร",
    openGraphDescription:
      "ค้นหาสูตรอาหารได้ทันทีจากวัตถุดิบที่มี วางแผนมื้ออาหารอย่างฉลาด ติดตามวันหมดอายุ และลดอาหารเหลือทิ้งด้วย AI",
    openGraphAlt: "CookFetch - ผู้ช่วยค้นหาสูตรด้วย AI",
    twitterTitle: "CookFetch - ผู้ช่วยค้นหาสูตรด้วย AI",
    twitterDescription:
      "เปลี่ยนวัตถุดิบที่มีให้เป็นเมนูอร่อยด้วย AI ค้นหาสูตร วางแผนมื้ออาหาร และลดอาหารเหลือทิ้ง",
    authorName: "ทีม CookFetch",
    appCreator: "CookFetch",
    appPublisher: "CookFetch",
    appSiteName: "CookFetch",
    twitterHandle: "@cookfetch",
    homeTitle: "หน้าแรก - CookFetch",
    homeDescription:
      "CookFetch ช่วยลดอาหารเหลือทิ้งด้วยการติดตามสต็อก แจ้งเตือนวันหมดอายุ และแนะนำสูตรอาหารอย่างชาญฉลาด",
    loginTitle: "เข้าสู่ระบบ - CookFetch",
    loginDescription:
      "เข้าสู่ระบบ CookFetch เพื่อจัดการอาหาร ติดตามวันหมดอายุ และรับคำแนะนำสูตรอาหารที่เหมาะกับคุณ",
    assistantTitle: "ผู้ช่วย AI - CookFetch",
    assistantDescription:
      "ใช้ผู้ช่วย AI ของ CookFetch เพื่อค้นหาไอเดียเมนูจากวัตถุดิบที่คุณมี",
    calendarTitle: "ปฏิทิน - CookFetch",
    calendarDescription:
      "ดูไทม์ไลน์วันหมดอายุอาหารและตารางวางแผนมื้ออาหารของคุณในปฏิทิน CookFetch",
    devicesTitle: "อุปกรณ์ - CookFetch",
    devicesDescription:
      "เชื่อมต่อและจัดการอุปกรณ์ครัวอัจฉริยะของคุณใน CookFetch",
    foodsTitle: "อาหารของฉัน - CookFetch",
    foodsDescription:
      "ติดตามสต็อกในตู้กับข้าวและตู้เย็น ตรวจวันหมดอายุ และลดอาหารเหลือทิ้งด้วย CookFetch",
    groceryTitle: "รายการซื้อ - CookFetch",
    groceryDescription:
      "สร้าง จัดระเบียบ และแปลงรายการซื้อเป็นตารางมื้ออาหารด้วย CookFetch",
    profileTitle: "โปรไฟล์ - CookFetch",
    profileDescription:
      "จัดการรายละเอียดบัญชีและค่ากำหนดส่วนตัวของคุณใน CookFetch",
    recipesTitle: "สูตรอาหาร - CookFetch",
    recipesDescription:
      "ค้นหาสูตรอาหารและสร้างไอเดียเมนูจากวัตถุดิบที่คุณมีใน CookFetch",
    recipeDetailTitle: "รายละเอียดสูตรอาหาร - CookFetch",
    recipeDetailDescription:
      "ดูรายละเอียดสูตรอาหารแบบครบถ้วน ทั้งวัตถุดิบและขั้นตอนการทำบน CookFetch",
    settingsTitle: "ตั้งค่า - CookFetch",
    settingsDescription:
      "ปรับแต่งการตั้งค่า ค่ากำหนด และประสบการณ์การใช้งานแอป CookFetch",
  },
} as const;

export function getMetadataTranslations(language: MetadataLanguage) {
  return metadataTranslations[language];
}
