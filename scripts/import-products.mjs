import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse .env.local
function loadEnv() {
  const envPath = join(__dirname, '../.env.local');
  const envContent = readFileSync(envPath, 'utf-8');
  const env = {};
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex !== -1) {
        const key = trimmed.substring(0, eqIndex);
        const value = trimmed.substring(eqIndex + 1).replace(/^["']|["']$/g, '');
        env[key] = value;
      }
    }
  }
  return env;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// CSV data
const products = [
  {
    title: "Vintage Denim Jacket",
    description: "Classic oversized vintage denim jacket in great condition",
    starting_bid: 25,
    buy_now: 79,
    duration_value: 3,
    duration_unit: "days",
    category: "Fashion",
    image_urls: ["https://picsum.photos/id/1011/800/800", "https://picsum.photos/id/1025/800/800"]
  },
  {
    title: "Black Leather Boots",
    description: "Genuine leather ankle boots with durable sole",
    starting_bid: 30,
    buy_now: 99,
    duration_value: 2,
    duration_unit: "days",
    category: "Fashion",
    image_urls: ["https://picsum.photos/id/1005/800/800", "https://picsum.photos/id/1040/800/800"]
  },
  {
    title: "Floral Summer Dress",
    description: "Lightweight floral midi dress perfect for warm weather",
    starting_bid: 15,
    buy_now: 49,
    duration_value: 4,
    duration_unit: "days",
    category: "Fashion",
    image_urls: ["https://picsum.photos/id/1062/800/800", "https://picsum.photos/id/1074/800/800"]
  },
  {
    title: "Classic White Sneakers",
    description: "Minimal white sneakers for everyday wear",
    starting_bid: 20,
    buy_now: 59,
    duration_value: 3,
    duration_unit: "days",
    category: "Fashion",
    image_urls: ["https://picsum.photos/id/1080/800/800", "https://picsum.photos/id/1084/800/800"]
  },
  {
    title: "Oversized Hoodie",
    description: "Cozy oversized cotton hoodie with front pocket",
    starting_bid: 12,
    buy_now: 39,
    duration_value: 3,
    duration_unit: "days",
    category: "Fashion",
    image_urls: ["https://picsum.photos/id/1069/800/800", "https://picsum.photos/id/1070/800/800"]
  },
  {
    title: "High Waisted Jeans",
    description: "High waisted slim fit denim jeans",
    starting_bid: 18,
    buy_now: 65,
    duration_value: 2,
    duration_unit: "days",
    category: "Fashion",
    image_urls: ["https://picsum.photos/id/1050/800/800", "https://picsum.photos/id/1033/800/800"]
  },
  {
    title: "Graphic Print Tee",
    description: "Cotton graphic t-shirt with bold streetwear design",
    starting_bid: 5,
    buy_now: 19,
    duration_value: 1,
    duration_unit: "days",
    category: "Fashion",
    image_urls: ["https://picsum.photos/id/1027/800/800", "https://picsum.photos/id/1035/800/800"]
  },
  {
    title: "Wool Scarf Set",
    description: "Soft wool scarf with matching knit beanie",
    starting_bid: 10,
    buy_now: 29,
    duration_value: 2,
    duration_unit: "days",
    category: "Fashion",
    image_urls: ["https://picsum.photos/id/1012/800/800", "https://picsum.photos/id/1013/800/800"]
  },
  {
    title: "Striped Button Down Shirt",
    description: "Smart casual striped button down shirt",
    starting_bid: 8,
    buy_now: 29,
    duration_value: 2,
    duration_unit: "days",
    category: "Fashion",
    image_urls: ["https://picsum.photos/id/1020/800/800", "https://picsum.photos/id/1021/800/800"]
  },
  {
    title: "Retro Sunglasses",
    description: "Classic retro sunglasses with UV protection",
    starting_bid: 5,
    buy_now: 25,
    duration_value: 1,
    duration_unit: "days",
    category: "Fashion",
    image_urls: ["https://picsum.photos/id/1003/800/800", "https://picsum.photos/id/1004/800/800"]
  }
];

async function importProducts() {
  // Get user by email
  const { data: userData, error: userError } = await supabase
    .from('profiles')
    .select('id, username, avatar')
    .eq('email', 'devin.patrick.fox@gmail.com')
    .single();

  if (userError || !userData) {
    console.error('Could not find user:', userError?.message);
    process.exit(1);
  }

  console.log(`Importing products for user: ${userData.username} (${userData.id})`);

  const now = new Date();
  const listings = products.map(p => {
    const multiplier = p.duration_unit === 'minutes' ? 60
      : p.duration_unit === 'hours' ? 3600
      : 86400;
    const durationSeconds = p.duration_value * multiplier;
    const endAt = new Date(now.getTime() + durationSeconds * 1000).toISOString();

    return {
      user_id: userData.id,
      title: p.title,
      description: p.description,
      images: p.image_urls,
      buy_now: p.buy_now,
      last_bid: p.starting_bid,
      end_at: endAt,
      seconds_left: durationSeconds,
      sold: false,
      date_posted: now.toISOString(),
      user_name: userData.username,
      user_avatar: userData.avatar || 'https://i.pravatar.cc/40?img=9',
      user_category: p.category,
    };
  });

  const { data, error } = await supabase
    .from('listings')
    .insert(listings)
    .select('id, title');

  if (error) {
    console.error('Import failed:', error.message);
    process.exit(1);
  }

  console.log(`Successfully imported ${data.length} products:`);
  data.forEach(item => console.log(`  - ${item.title} (${item.id})`));
}

importProducts();
