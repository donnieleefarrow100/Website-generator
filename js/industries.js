/* ============================================================
   Industry Research Engine
   Given any free-text business type, this module "researches" it:
   1. Exact/keyword match against a knowledge base of industries
   2. Fallback to a broader business category via keyword scoring
   3. Final generic fallback that still produces sensible content
   Every profile carries content (services, copy, stats, reviews)
   and design direction (palette + font pairing + hero mood).
   ============================================================ */

const PALETTES = {
  indigo:   { primary: "#4f46e5", primaryDark: "#3730a3", accent: "#f59e0b", ink: "#111827", soft: "#eef2ff", heroMode: "light" },
  ocean:    { primary: "#0e7490", primaryDark: "#155e75", accent: "#f97316", ink: "#0f172a", soft: "#ecfeff", heroMode: "light" },
  forest:   { primary: "#15803d", primaryDark: "#14532d", accent: "#eab308", ink: "#1a2e1a", soft: "#f0fdf4", heroMode: "light" },
  crimson:  { primary: "#be123c", primaryDark: "#881337", accent: "#f59e0b", ink: "#1c1917", soft: "#fff1f2", heroMode: "dark"  },
  midnight: { primary: "#2563eb", primaryDark: "#1e3a8a", accent: "#22d3ee", ink: "#0b1220", soft: "#eff6ff", heroMode: "dark"  },
  slate:    { primary: "#334155", primaryDark: "#1e293b", accent: "#0ea5e9", ink: "#0f172a", soft: "#f1f5f9", heroMode: "dark"  },
  plum:     { primary: "#7c3aed", primaryDark: "#5b21b6", accent: "#ec4899", ink: "#1e1b4b", soft: "#f5f3ff", heroMode: "dark"  },
  terra:    { primary: "#c2410c", primaryDark: "#7c2d12", accent: "#16a34a", ink: "#292524", soft: "#fff7ed", heroMode: "light" },
  gold:     { primary: "#a16207", primaryDark: "#713f12", accent: "#0f766e", ink: "#1c1917", soft: "#fefce8", heroMode: "elegant" },
  teal:     { primary: "#0d9488", primaryDark: "#115e59", accent: "#f43f5e", ink: "#134e4a", soft: "#f0fdfa", heroMode: "light" },
  charcoal: { primary: "#18181b", primaryDark: "#09090b", accent: "#facc15", ink: "#18181b", soft: "#fafafa", heroMode: "dark"  },
  rose:     { primary: "#e11d48", primaryDark: "#9f1239", accent: "#8b5cf6", ink: "#1f1720", soft: "#fff1f2", heroMode: "light" },
};

const FONT_PAIRS = {
  modern:   { heading: "Sora",            body: "Inter",           import: "family=Sora:wght@500;600;700;800&family=Inter:wght@400;500;600" },
  elegant:  { heading: "Playfair Display", body: "Source Sans 3",  import: "family=Playfair+Display:wght@500;600;700&family=Source+Sans+3:wght@400;600" },
  friendly: { heading: "Plus Jakarta Sans", body: "Inter",         import: "family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600" },
  bold:     { heading: "Space Grotesk",   body: "Inter",           import: "family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600" },
  classic:  { heading: "Libre Baskerville", body: "Inter",         import: "family=Libre+Baskerville:wght@400;700&family=Inter:wght@400;500;600" },
};

/* Broad business categories — the fallback layer of "research".
   Any business type that doesn't match a specific industry gets
   scored against these keyword sets. */
const CATEGORIES = {
  creative: {
    keywords: ["design", "creative", "studio", "art", "artist", "brand", "media", "video", "film", "animation", "illustration", "photo", "content"],
    palette: "plum", fonts: "bold",
    heroHeadline: "Creative work that makes {name} unforgettable",
    heroSub: "{name} is a {type} helping brands stand out with bold ideas, sharp execution, and work that gets noticed.",
    aboutTitle: "A {type} built on craft",
    about: [
      "{name} was founded on a simple belief: great creative work isn't decoration — it's strategy made visible. Every project starts with understanding your goals, your audience, and what makes you different.",
      "From first concept to final delivery, we obsess over the details so the finished work doesn't just look good — it performs. Our clients stay with us because we treat their brand like our own."
    ],
    services: [
      { icon: "🎨", name: "Brand & Identity", desc: "Logos, visual systems, and brand guidelines that give you a consistent, memorable presence everywhere you show up." },
      { icon: "🖥️", name: "Digital Design", desc: "Websites, social graphics, and digital campaigns designed to convert attention into customers." },
      { icon: "📐", name: "Print & Collateral", desc: "Business cards, brochures, packaging, and signage — polished materials that make a professional first impression." },
      { icon: "💡", name: "Creative Direction", desc: "Big-picture concepting and art direction to keep every touchpoint of your brand on-message and on-style." },
      { icon: "🚀", name: "Campaign Design", desc: "Launch-ready creative for product releases, promotions, and seasonal pushes — delivered on deadline." },
      { icon: "🤝", name: "Ongoing Support", desc: "Retainer partnerships for teams that need reliable, high-quality creative every month without hiring in-house." },
    ],
    stats: [["120+", "Projects delivered"], ["98%", "Client satisfaction"], ["10+", "Industries served"], ["24h", "Average response time"]],
    reviews: [
      ["Working with {name} completely changed how our brand looks and feels. The process was smooth and the results speak for themselves.", "Jordan M.", "Small business owner"],
      ["Fast, professional, and genuinely creative. They understood our vision better than we did.", "Priya S.", "Marketing director"],
      ["Every deliverable was on time and beyond what we expected. Highly recommended.", "Chris T.", "Startup founder"],
    ],
    ctaTitle: "Have a project in mind?",
    ctaSub: "Tell us what you're building and we'll show you what's possible.",
    ctaButton: "Start a project",
  },

  trades: {
    keywords: ["construction", "contractor", "builder", "roofing", "plumbing", "plumber", "electric", "electrician", "hvac", "landscap", "renovation", "remodel", "painting", "painter", "carpentry", "concrete", "handyman", "fencing", "flooring", "excavat", "welding", "masonry"],
    palette: "terra", fonts: "bold",
    heroHeadline: "Quality work. Done right. On time.",
    heroSub: "{name} is a trusted {type} delivering dependable workmanship, honest pricing, and results built to last.",
    aboutTitle: "Built on reputation",
    about: [
      "{name} was built the same way we build everything else — with care, skill, and no shortcuts. We show up on time, communicate clearly, and stand behind every job we finish.",
      "Whether it's a small repair or a major project, you'll work with experienced professionals who are licensed, insured, and committed to doing the job right the first time."
    ],
    services: [
      { icon: "🏗️", name: "New Projects", desc: "Full-scope builds managed from planning and permits through final walkthrough — one team, one point of contact." },
      { icon: "🔧", name: "Repairs & Maintenance", desc: "Fast, reliable fixes that solve the real problem, not just the symptom. Upfront quotes before work begins." },
      { icon: "🏠", name: "Renovations", desc: "Transform your space with quality upgrades — kitchens, bathrooms, additions, and everything in between." },
      { icon: "📋", name: "Free Estimates", desc: "Clear, itemized estimates with no hidden costs. You'll know exactly what you're paying for and why." },
      { icon: "🛡️", name: "Licensed & Insured", desc: "Fully licensed, bonded, and insured for your protection and peace of mind on every job." },
      { icon: "⏱️", name: "On-Time Guarantee", desc: "We respect your schedule. Realistic timelines, proactive updates, and crews that show up when we say they will." },
    ],
    stats: [["500+", "Jobs completed"], ["15+", "Years experience"], ["100%", "Licensed & insured"], ["5★", "Average rating"]],
    reviews: [
      ["Professional from the first phone call to the final walkthrough. The crew was respectful and the quality is outstanding.", "Dana R.", "Homeowner"],
      ["Fair pricing, honest timeline, and the work exceeded expectations. We'll never use anyone else.", "Mike B.", "Property manager"],
      ["They finished ahead of schedule and left the site cleaner than they found it. Rare these days.", "Sandra L.", "Business owner"],
    ],
    ctaTitle: "Get your free estimate",
    ctaSub: "Tell us about your project and we'll get back to you within one business day.",
    ctaButton: "Request an estimate",
  },

  professional: {
    keywords: ["consult", "account", "cpa", "bookkeep", "tax", "law", "legal", "attorney", "advisor", "advisory", "financial", "finance", "insurance", "hr", "recruit", "staffing", "notary", "audit", "wealth", "invest", "broker", "agency"],
    palette: "slate", fonts: "modern",
    heroHeadline: "Expert guidance you can rely on",
    heroSub: "{name} provides professional {type} services with clarity, integrity, and results — so you can make decisions with confidence.",
    aboutTitle: "Experience that works for you",
    about: [
      "{name} exists to remove complexity from your world. We combine deep expertise with straight answers, so you always understand where you stand and what to do next.",
      "Our clients range from individuals to growing companies, and every engagement gets the same standard: responsive service, meticulous work, and advice that puts your interests first."
    ],
    services: [
      { icon: "📊", name: "Strategic Advisory", desc: "Clear, actionable guidance tailored to your goals — grounded in data and years of hands-on experience." },
      { icon: "📁", name: "Compliance & Reporting", desc: "Stay ahead of deadlines and regulations with accurate, on-time filings and airtight documentation." },
      { icon: "🧭", name: "Planning & Forecasting", desc: "Look forward with confidence. We help you model scenarios, manage risk, and plan for what's next." },
      { icon: "🔍", name: "Reviews & Audits", desc: "Independent, thorough reviews that surface problems early and give stakeholders confidence." },
      { icon: "💬", name: "On-Call Support", desc: "Questions don't keep business hours. Get responsive answers from a team that knows your situation." },
      { icon: "🤝", name: "Long-Term Partnership", desc: "We grow with you — scaling our support as your needs evolve, from first engagement to every milestone after." },
    ],
    stats: [["200+", "Clients served"], ["20+", "Years combined experience"], ["100%", "Confidential"], ["24h", "Response time"]],
    reviews: [
      ["They explain complicated things in plain language and always respond quickly. Worth every penny.", "Angela K.", "Business owner"],
      ["Thorough, professional, and proactive. They caught issues our previous firm missed for years.", "Robert D.", "Company director"],
      ["I finally feel like someone is actually looking out for my interests. Exceptional service.", "Maria G.", "Client"],
    ],
    ctaTitle: "Schedule a consultation",
    ctaSub: "Get a confidential, no-obligation consultation to see how we can help.",
    ctaButton: "Book a consultation",
  },

  health: {
    keywords: ["dental", "dentist", "clinic", "medical", "doctor", "health", "therapy", "therapist", "chiroprac", "counsel", "wellness", "med spa", "veterinar", "vet ", "optomet", "pediatric", "dermatolog", "physical therapy", "psycholog", "psychiatr", "acupunct", "massage", "nursing", "home care", "caregiv"],
    palette: "teal", fonts: "friendly",
    heroHeadline: "Care that puts you first",
    heroSub: "{name} is a {type} committed to compassionate, professional care — delivered by people who genuinely listen.",
    aboutTitle: "Your wellbeing is our work",
    about: [
      "At {name}, care starts with listening. We take the time to understand your needs, explain your options clearly, and build a plan that fits your life — not the other way around.",
      "Our team combines professional expertise with genuine warmth. From your first visit, you'll notice the difference a patient-first approach makes."
    ],
    services: [
      { icon: "🩺", name: "Comprehensive Care", desc: "Full-spectrum services under one roof, so you get consistent, coordinated care from a team that knows you." },
      { icon: "📅", name: "Easy Scheduling", desc: "Flexible appointments, prompt confirmations, and reminders — because getting care shouldn't be a hassle." },
      { icon: "❤️", name: "Personalized Plans", desc: "No cookie-cutter treatment. Every plan is tailored to your history, your goals, and your comfort." },
      { icon: "🧑‍⚕️", name: "Experienced Team", desc: "Credentialed professionals who stay current with best practices and treat every patient with respect." },
      { icon: "🏥", name: "Modern Facility", desc: "A clean, comfortable, modern environment equipped with up-to-date technology and safety standards." },
      { icon: "💬", name: "Clear Communication", desc: "Straight answers about options, costs, and next steps — before, during, and after every visit." },
    ],
    stats: [["1,000+", "Patients served"], ["15+", "Years of care"], ["5★", "Patient rating"], ["Same-week", "Appointments"]],
    reviews: [
      ["The kindest, most thorough care I've ever received. They actually take time with you.", "Emily W.", "Patient"],
      ["From the front desk to the providers, everyone is warm and professional. Highly recommend.", "James H.", "Patient"],
      ["They explained everything clearly and made me feel completely at ease.", "Olivia P.", "Patient"],
    ],
    ctaTitle: "Ready to feel your best?",
    ctaSub: "Book your appointment today — new patients are always welcome.",
    ctaButton: "Book an appointment",
  },

  food: {
    keywords: ["restaurant", "cafe", "coffee", "bakery", "catering", "caterer", "food", "bar ", "bistro", "grill", "pizza", "taco", "sushi", "deli", "bbq", "brewery", "juice", "dessert", "chef", "kitchen", "diner", "food truck"],
    palette: "crimson", fonts: "elegant",
    heroHeadline: "Made fresh. Served with pride.",
    heroSub: "{name} brings people together over exceptional food, warm hospitality, and an experience worth coming back for.",
    aboutTitle: "Our story",
    about: [
      "{name} started with a love of good food and the belief that every guest deserves something special. We source quality ingredients, prepare everything with care, and serve it with genuine hospitality.",
      "Whether you're stopping in for the first time or the hundredth, our goal is the same: great food, a welcoming atmosphere, and service that makes your day better."
    ],
    services: [
      { icon: "🍽️", name: "Signature Menu", desc: "A carefully crafted menu built on fresh, quality ingredients — with favorites you'll crave and specials worth trying." },
      { icon: "🥂", name: "Events & Private Dining", desc: "Celebrations, meetings, and gatherings — we'll make your event delicious and effortless." },
      { icon: "🚗", name: "Takeout & Delivery", desc: "Your favorites, ready when you are. Easy ordering for pickup or delivery straight to your door." },
      { icon: "🎉", name: "Catering", desc: "Full-service catering for events of any size, with menus customized to your occasion and budget." },
      { icon: "🌱", name: "Fresh & Local", desc: "We prioritize fresh, seasonal, and locally sourced ingredients whenever possible." },
      { icon: "⭐", name: "Hospitality First", desc: "Friendly faces, attentive service, and an atmosphere that makes everyone feel at home." },
    ],
    stats: [["10K+", "Happy guests"], ["4.8★", "Average rating"], ["100%", "Fresh daily"], ["7 days", "A week"]],
    reviews: [
      ["Absolutely delicious — you can taste the care in every dish. The staff treats you like family.", "Nina F.", "Regular guest"],
      ["Best spot in town, hands down. Great food, great people, great vibe.", "Marcus J.", "Local guest"],
      ["They catered our event and it was flawless. Guests are still talking about the food.", "Rachel B.", "Event host"],
    ],
    ctaTitle: "Come hungry. Leave happy.",
    ctaSub: "Reserve a table, order online, or ask about catering your next event.",
    ctaButton: "Get in touch",
  },

  retail: {
    keywords: ["shop", "store", "boutique", "retail", "clothing", "apparel", "jewelry", "furniture", "gift", "florist", "flower", "book", "toy", "market", "thrift", "antique", "ecommerce", "online store"],
    palette: "rose", fonts: "friendly",
    heroHeadline: "Find something you'll love",
    heroSub: "{name} is a {type} curating quality products with personal service you won't find anywhere else.",
    aboutTitle: "Why people shop with us",
    about: [
      "{name} was founded on the idea that shopping should feel personal again. Every item we carry is chosen with care, and every customer gets honest recommendations — never a hard sell.",
      "We're proud to be part of this community, and it shows: from our curated selection to our friendly team, everything we do is designed to make you glad you stopped by."
    ],
    services: [
      { icon: "🛍️", name: "Curated Selection", desc: "Hand-picked products chosen for quality, value, and style — not just whatever's trending." },
      { icon: "🎁", name: "Gifts & Occasions", desc: "Thoughtful gift options and wrapping for birthdays, holidays, and every celebration in between." },
      { icon: "💝", name: "Personal Service", desc: "Real recommendations from people who know the products and genuinely want to help." },
      { icon: "🔄", name: "Easy Returns", desc: "Shop with confidence — hassle-free exchanges and returns, no fine print games." },
      { icon: "📦", name: "Order & Delivery", desc: "Can't make it in? Order remotely and we'll have it ready for pickup or shipped to your door." },
      { icon: "✨", name: "New Arrivals", desc: "Fresh inventory arriving regularly — follow along so you never miss what's new." },
    ],
    stats: [["5K+", "Happy customers"], ["4.9★", "Customer rating"], ["100s", "Of unique finds"], ["Local", "& independent"]],
    reviews: [
      ["My favorite place to shop. The selection is beautiful and the staff is so helpful.", "Grace L.", "Customer"],
      ["Every gift I've bought here has been a hit. They have a great eye.", "Tom W.", "Customer"],
      ["Personal, friendly service that big stores can't match. Love supporting this place.", "Aisha N.", "Customer"],
    ],
    ctaTitle: "Come see what's new",
    ctaSub: "Visit us, browse the latest arrivals, or reach out — we'd love to help you find the perfect thing.",
    ctaButton: "Get in touch",
  },

  tech: {
    keywords: ["software", "tech", "it ", "app", "web", "developer", "development", "saas", "startup", "data", "cyber", "security", "cloud", "ai ", "automation", "computer", "network", "hosting", "engineering"],
    palette: "midnight", fonts: "modern",
    heroHeadline: "Technology that moves your business forward",
    heroSub: "{name} builds and supports reliable technology solutions — so you can focus on running your business, not fighting your tools.",
    aboutTitle: "Engineering with purpose",
    about: [
      "{name} bridges the gap between business goals and technical execution. We don't push technology for its own sake — we solve real problems with solutions that are reliable, secure, and built to scale.",
      "Our team communicates in plain English, ships on schedule, and sticks around after launch. That's why clients trust us with the systems their business runs on."
    ],
    services: [
      { icon: "💻", name: "Custom Solutions", desc: "Software, websites, and applications built around your workflow — not the other way around." },
      { icon: "☁️", name: "Cloud & Infrastructure", desc: "Modern, secure infrastructure that scales with you and keeps your systems fast and available." },
      { icon: "🔐", name: "Security & Reliability", desc: "Best-practice security, backups, and monitoring baked in from day one — not bolted on later." },
      { icon: "⚙️", name: "Automation", desc: "Eliminate repetitive manual work with automations that save hours every week." },
      { icon: "📈", name: "Data & Insights", desc: "Turn scattered data into dashboards and reports that actually drive decisions." },
      { icon: "🛟", name: "Ongoing Support", desc: "Responsive maintenance and support plans so small issues never become big outages." },
    ],
    stats: [["99.9%", "Uptime delivered"], ["50+", "Systems shipped"], ["<1h", "Critical response"], ["100%", "Plain-English support"]],
    reviews: [
      ["They rebuilt our systems and cut our manual work in half. Genuinely transformative.", "Kevin O.", "Operations lead"],
      ["Finally, a tech partner that explains things clearly and delivers on time.", "Susan M.", "Business owner"],
      ["Professional, responsive, and deeply skilled. Our platform has never been more stable.", "David C.", "Product manager"],
    ],
    ctaTitle: "Let's talk about your project",
    ctaSub: "Tell us what you're trying to build or fix — we'll map out a practical path forward.",
    ctaButton: "Start the conversation",
  },

  fitness: {
    keywords: ["gym", "fitness", "trainer", "training", "yoga", "pilates", "crossfit", "martial", "boxing", "dance", "sport", "coach", "athletic", "nutrition"],
    palette: "charcoal", fonts: "bold",
    heroHeadline: "Stronger starts here",
    heroSub: "{name} helps you build real results with expert coaching, proven programs, and a community that keeps you going.",
    aboutTitle: "More than a workout",
    about: [
      "{name} was built for people who want real results — not gimmicks. Our programs meet you where you are, push you the right amount, and adapt as you get stronger.",
      "Every member gets genuine coaching and a community that celebrates progress. Whether you're just starting or leveling up, you belong here."
    ],
    services: [
      { icon: "💪", name: "Personal Training", desc: "One-on-one coaching with programs built around your goals, schedule, and starting point." },
      { icon: "👥", name: "Group Classes", desc: "High-energy sessions that make consistency fun — all levels welcome, no intimidation." },
      { icon: "🥗", name: "Nutrition Guidance", desc: "Practical, sustainable nutrition coaching that works with your life — no crash diets." },
      { icon: "📋", name: "Custom Programs", desc: "Structured plans with progressive milestones so you always know what's next." },
      { icon: "📱", name: "Progress Tracking", desc: "Measure what matters and watch your numbers move — strength, endurance, and beyond." },
      { icon: "🏆", name: "Results Guarantee", desc: "Show up, do the work, follow the plan — and you will see results. We stake our name on it." },
    ],
    stats: [["500+", "Members strong"], ["10+", "Certified coaches"], ["6 days", "A week"], ["Real", "Results"]],
    reviews: [
      ["Down 30 pounds and stronger than I've ever been. The coaches here actually care.", "Tyler R.", "Member"],
      ["I was intimidated to start, but everyone made me feel welcome from day one.", "Jasmine K.", "Member"],
      ["Best investment in myself I've ever made. The programming is smart and it works.", "Andre B.", "Member"],
    ],
    ctaTitle: "Your first session is on us",
    ctaSub: "Come try a session, meet the team, and see if we're the right fit — no pressure, no contracts.",
    ctaButton: "Claim your free session",
  },

  events: {
    keywords: ["event", "wedding", "planner", "planning", "party", "dj", "entertainment", "venue", "rental", "celebration", "conference", "festival"],
    palette: "gold", fonts: "elegant",
    heroHeadline: "Unforgettable moments, flawlessly planned",
    heroSub: "{name} turns your vision into an occasion your guests will talk about for years — handled with care from first idea to final toast.",
    aboutTitle: "Every detail, handled",
    about: [
      "{name} believes the best events feel effortless — because someone behind the scenes sweated every detail. That's us. We plan meticulously, coordinate seamlessly, and stay calm when it counts.",
      "From intimate gatherings to large celebrations, we bring creativity, vendor relationships, and battle-tested logistics so you can actually enjoy your own event."
    ],
    services: [
      { icon: "📋", name: "Full Planning", desc: "End-to-end planning from concept and budget through day-of execution — one team, zero stress." },
      { icon: "🎨", name: "Design & Styling", desc: "Cohesive themes, décor, and ambiance that photograph beautifully and feel unmistakably you." },
      { icon: "🤝", name: "Vendor Coordination", desc: "Trusted vendors, negotiated pricing, and airtight coordination so everyone delivers on cue." },
      { icon: "⏱️", name: "Day-Of Management", desc: "Timelines, cues, and contingencies managed invisibly so your day flows perfectly." },
      { icon: "💰", name: "Budget Management", desc: "Smart allocation and transparent tracking so you get maximum impact from every dollar." },
      { icon: "✨", name: "Custom Touches", desc: "Personalized details and moments that make your event genuinely one of a kind." },
    ],
    stats: [["150+", "Events delivered"], ["5★", "Client rating"], ["50+", "Trusted vendors"], ["Zero", "Missed deadlines"]],
    reviews: [
      ["Our wedding was perfect — truly perfect. Every detail was handled and we just got to be present.", "Lauren & Sam", "Wedding clients"],
      ["The most organized professionals I've ever worked with. Our gala ran without a single hitch.", "Denise F.", "Nonprofit director"],
      ["Worth every penny. They took a stressful process and made it genuinely fun.", "Kim A.", "Client"],
    ],
    ctaTitle: "Let's plan something amazing",
    ctaSub: "Tell us about your event and we'll schedule a free consultation to bring your vision to life.",
    ctaButton: "Start planning",
  },

  personalCare: {
    keywords: ["salon", "hair", "barber", "beauty", "nail", "spa", "esthetic", "makeup", "lash", "brow", "tattoo", "grooming", "skincare"],
    palette: "rose", fonts: "elegant",
    heroHeadline: "Look good. Feel even better.",
    heroSub: "{name} delivers expert services in a welcoming space — where you leave looking sharp and feeling like yourself again.",
    aboutTitle: "Craft, care, and consistency",
    about: [
      "{name} is built on skill you can see and service you can feel. Our team trains constantly, listens carefully, and treats every appointment like it matters — because it does.",
      "Step in, relax, and let us take care of the rest. Whether it's your regular appointment or a special occasion, you'll leave feeling like the best version of yourself."
    ],
    services: [
      { icon: "✂️", name: "Signature Services", desc: "Our core services, perfected — precise, consistent, and tailored to exactly what you want." },
      { icon: "💆", name: "Premium Treatments", desc: "Elevated treatments and add-ons for when you want the full experience." },
      { icon: "📅", name: "Easy Booking", desc: "Book in seconds, get reminders, and reschedule without the phone tag." },
      { icon: "🌟", name: "Special Occasions", desc: "Weddings, events, photos — look flawless when it matters most." },
      { icon: "🧴", name: "Quality Products", desc: "We use and carry professional-grade products we trust on our own clients." },
      { icon: "💖", name: "Loyalty Rewards", desc: "Regulars get love — ask about our loyalty perks and referral rewards." },
    ],
    stats: [["3K+", "Happy clients"], ["4.9★", "Rating"], ["10+", "Years of craft"], ["Walk-ins", "Welcome"]],
    reviews: [
      ["I've never trusted anyone else since my first visit. Consistent perfection every time.", "Monica V.", "Regular client"],
      ["The atmosphere is so welcoming and the results are always exactly what I asked for.", "Derek S.", "Client"],
      ["Booked for my wedding day and they absolutely delivered. Stunning work.", "Hannah J.", "Bridal client"],
    ],
    ctaTitle: "Book your appointment",
    ctaSub: "Reserve your spot today — evenings and weekend appointments available.",
    ctaButton: "Book now",
  },

  automotive: {
    keywords: ["auto", "car", "mechanic", "tire", "detail", "towing", "body shop", "vehicle", "motorcycle", "oil change", "transmission", "dealership"],
    palette: "charcoal", fonts: "bold",
    heroHeadline: "Honest work. Fair prices. Done right.",
    heroSub: "{name} keeps you on the road with expert service, straight answers, and repairs we stand behind.",
    aboutTitle: "A shop you can trust",
    about: [
      "{name} was founded on a simple promise: we'll tell you what's actually wrong, what it actually costs, and what can actually wait. No scare tactics, no surprise charges.",
      "Our certified technicians treat every vehicle like their own. That's why our customers come back — and send their friends and family, too."
    ],
    services: [
      { icon: "🔧", name: "Repairs & Diagnostics", desc: "Accurate diagnostics and quality repairs explained in plain language before any work begins." },
      { icon: "🛢️", name: "Routine Maintenance", desc: "Oil changes, fluids, brakes, and scheduled maintenance that keeps small issues from becoming big bills." },
      { icon: "🛞", name: "Tires & Alignment", desc: "Tire sales, rotation, balancing, and alignment for a smoother, safer, longer-lasting ride." },
      { icon: "📋", name: "Free Inspections", desc: "Honest multi-point inspections with photos and clear explanations — no pressure, ever." },
      { icon: "🛡️", name: "Warranty Backed", desc: "We stand behind our work with real warranties on parts and labor." },
      { icon: "⚡", name: "Fast Turnaround", desc: "Most services done same-day, with honest timelines when bigger jobs need more time." },
    ],
    stats: [["10K+", "Vehicles serviced"], ["20+", "Years in business"], ["ASE", "Certified techs"], ["4.8★", "Customer rating"]],
    reviews: [
      ["The only shop I trust. They've saved me thousands by being honest about what I actually needed.", "Frank P.", "Customer"],
      ["Fast, fair, and friendly. They explained everything and the price matched the quote exactly.", "Alicia M.", "Customer"],
      ["Took my car in at 8am, back on the road by lunch. Great communication throughout.", "Greg H.", "Customer"],
    ],
    ctaTitle: "Get your vehicle checked",
    ctaSub: "Call, message, or stop by — we'll take a look and give you a straight answer.",
    ctaButton: "Schedule service",
  },

  education: {
    keywords: ["tutor", "school", "education", "teaching", "academy", "lessons", "course", "training center", "daycare", "childcare", "preschool", "language", "test prep", "music lessons", "driving school"],
    palette: "indigo", fonts: "friendly",
    heroHeadline: "Learning that actually sticks",
    heroSub: "{name} helps learners build real skills and real confidence — with patient, expert instruction tailored to how each person learns best.",
    aboutTitle: "Teaching, done differently",
    about: [
      "{name} believes anyone can learn anything with the right guidance. We meet learners where they are, adapt to how they think, and celebrate every milestone along the way.",
      "Our instructors combine genuine expertise with genuine patience. The result: learners who don't just pass — they understand, improve, and enjoy it."
    ],
    services: [
      { icon: "🎯", name: "Personalized Instruction", desc: "Sessions built around each learner's pace, goals, and learning style — never one-size-fits-all." },
      { icon: "📚", name: "Structured Programs", desc: "Clear curricula with measurable milestones so progress is visible week over week." },
      { icon: "🧑‍🏫", name: "Expert Instructors", desc: "Experienced, vetted instructors who know their subject and how to actually teach it." },
      { icon: "📈", name: "Progress Reports", desc: "Regular updates so learners and families always know what's improving and what's next." },
      { icon: "🕐", name: "Flexible Scheduling", desc: "Sessions that fit your life — after school, evenings, weekends, in person or online." },
      { icon: "🌟", name: "Confidence Building", desc: "We build skills and self-belief together, because confident learners go further." },
    ],
    stats: [["500+", "Students taught"], ["95%", "Goal achievement"], ["10+", "Years teaching"], ["5★", "Parent rating"]],
    reviews: [
      ["My daughter went from dreading the subject to loving it. Her grades — and confidence — soared.", "Patricia N.", "Parent"],
      ["Patient, encouraging, and incredibly knowledgeable. Exactly what we were looking for.", "Omar E.", "Parent"],
      ["I passed my exam on the first try thanks to their structured approach.", "Bianca R.", "Student"],
    ],
    ctaTitle: "Start learning today",
    ctaSub: "Book a free intro session and see the difference the right instruction makes.",
    ctaButton: "Book a free session",
  },

  music: {
    keywords: ["music", "musician", "band", "producer", "recording", "audio", "sound", "singer", "songwriter", "record label", "podcast"],
    palette: "plum", fonts: "bold",
    heroHeadline: "Sound that moves people",
    heroSub: "{name} brings professional sound, creative vision, and years of experience to every project, performance, and recording.",
    aboutTitle: "The story behind the sound",
    about: [
      "{name} lives and breathes music. What started as pure passion has grown into a professional operation trusted by artists, venues, and clients who care about quality sound.",
      "Every project gets full creative attention and technical precision — because good enough isn't. If it has our name on it, it's ready for the world."
    ],
    services: [
      { icon: "🎵", name: "Live Performance", desc: "Professional, engaging performances tailored to your venue, audience, and occasion." },
      { icon: "🎙️", name: "Recording & Production", desc: "Studio-quality recording, mixing, and production that makes your sound release-ready." },
      { icon: "🎧", name: "Mixing & Mastering", desc: "Polished, radio-ready mixes and masters that translate on every speaker and platform." },
      { icon: "🎼", name: "Original Composition", desc: "Custom music for artists, brands, film, and media — written to fit your vision exactly." },
      { icon: "🎤", name: "Events & Bookings", desc: "Weddings, corporate events, festivals, private parties — professional from load-in to encore." },
      { icon: "🤝", name: "Artist Development", desc: "Coaching, arrangement, and career guidance for artists ready to take the next step." },
    ],
    stats: [["300+", "Shows & sessions"], ["10+", "Years in music"], ["100%", "Professional gear"], ["5★", "Client rating"]],
    reviews: [
      ["Our wedding music was absolute perfection. Guests kept asking who they were.", "Melissa & Jake", "Wedding clients"],
      ["The production quality blew me away. My tracks have never sounded this good.", "K. Rivers", "Recording artist"],
      ["Professional, punctual, and insanely talented. Booked them three times now.", "Vince D.", "Event organizer"],
    ],
    ctaTitle: "Let's make something great",
    ctaSub: "Booking dates fill fast — reach out with your date, venue, or project details.",
    ctaButton: "Check availability",
  },

  realEstate: {
    keywords: ["real estate", "realtor", "property", "homes", "housing", "mortgage", "title", "apartment", "leasing", "property management"],
    palette: "slate", fonts: "elegant",
    heroHeadline: "Your next move, made simple",
    heroSub: "{name} guides you through buying, selling, and investing with local expertise, honest advice, and negotiation that works for you.",
    aboutTitle: "Local expertise. Personal service.",
    about: [
      "{name} knows this market block by block. We combine deep local knowledge with responsive, personal service — because real estate decisions are too important for voicemail tag and generic advice.",
      "Whether you're buying your first home, selling to move up, or building a portfolio, we'll give you the straight numbers and steady guidance to move with confidence."
    ],
    services: [
      { icon: "🏡", name: "Buying", desc: "From search to keys — expert guidance, sharp negotiation, and access to listings that fit your life and budget." },
      { icon: "💰", name: "Selling", desc: "Strategic pricing, professional marketing, and negotiation that maximizes what you walk away with." },
      { icon: "📊", name: "Market Analysis", desc: "Real data on values, trends, and timing so you decide with facts, not guesses." },
      { icon: "🏢", name: "Investment Properties", desc: "Identify, evaluate, and acquire income properties with clear numbers on returns." },
      { icon: "🔑", name: "Property Management", desc: "Full-service management that protects your asset and keeps tenants happy." },
      { icon: "🤝", name: "Guidance Every Step", desc: "Inspections, paperwork, deadlines, closing — we handle the process so nothing slips." },
    ],
    stats: [["$50M+", "In transactions"], ["200+", "Families served"], ["15+", "Years local"], ["5★", "Client rating"]],
    reviews: [
      ["Sold our home over asking in nine days. Communication was outstanding start to finish.", "The Hendersons", "Sellers"],
      ["As first-time buyers we had a million questions — they answered every single one patiently.", "Carlos & Amy", "Buyers"],
      ["Sharp, honest, and always available. The only agent I'll ever recommend.", "Diane T.", "Investor"],
    ],
    ctaTitle: "Thinking about a move?",
    ctaSub: "Get a free, no-pressure consultation and find out what's possible in today's market.",
    ctaButton: "Get a free consultation",
  },

  cleaning: {
    keywords: ["clean", "janitorial", "maid", "housekeeping", "pressure wash", "carpet", "window washing", "sanitiz"],
    palette: "ocean", fonts: "friendly",
    heroHeadline: "Spotless spaces, every time",
    heroSub: "{name} delivers reliable, thorough cleaning with vetted professionals, flexible scheduling, and a satisfaction guarantee.",
    aboutTitle: "Clean you can count on",
    about: [
      "{name} exists because a clean space changes everything — how you feel, how you work, how you live. We show up on schedule, clean like it's our own place, and never cut corners.",
      "Every team member is vetted, trained, and insured. Every job is backed by our satisfaction guarantee. If something's not right, we make it right."
    ],
    services: [
      { icon: "🧹", name: "Recurring Cleaning", desc: "Weekly, bi-weekly, or monthly service that keeps your space consistently spotless." },
      { icon: "✨", name: "Deep Cleaning", desc: "Top-to-bottom detail cleaning that resets your space — perfect for seasons, moves, and fresh starts." },
      { icon: "🏢", name: "Commercial Cleaning", desc: "Offices, storefronts, and facilities cleaned after hours so your business always looks its best." },
      { icon: "📦", name: "Move In / Move Out", desc: "Landlord-ready cleans that protect deposits and make new spaces feel brand new." },
      { icon: "🌿", name: "Safe Products", desc: "Effective, safe cleaning products — with eco-friendly options available on request." },
      { icon: "✅", name: "Satisfaction Guaranteed", desc: "Not happy with a spot? Tell us within 24 hours and we'll re-clean it free." },
    ],
    stats: [["2K+", "Cleans completed"], ["100%", "Vetted & insured"], ["4.9★", "Customer rating"], ["24h", "Re-clean guarantee"]],
    reviews: [
      ["My house has never looked this good. Consistent, thorough, and trustworthy.", "Karen D.", "Home client"],
      ["They clean our office nightly and it's immaculate every morning. Zero complaints in two years.", "Paul V.", "Office manager"],
      ["Booked a move-out clean and got my full deposit back. Worth every cent.", "Jess M.", "Renter"],
    ],
    ctaTitle: "Get your free quote",
    ctaSub: "Tell us about your space and we'll send a clear, no-obligation quote today.",
    ctaButton: "Get a quote",
  },

  petCare: {
    keywords: ["pet", "dog", "cat", "grooming", "boarding", "kennel", "walker", "animal", "puppy", "training dog"],
    palette: "forest", fonts: "friendly",
    heroHeadline: "Care they'll wag about",
    heroSub: "{name} treats your pets like family — with attentive care, real experience, and updates that give you total peace of mind.",
    aboutTitle: "For the love of animals",
    about: [
      "{name} started with a simple truth: pets aren't just animals, they're family. Every service we offer is built around their comfort, safety, and happiness — and your peace of mind.",
      "Our team is trained, insured, and genuinely obsessed with animals. Expect photo updates, honest communication, and a pet that's excited to come back."
    ],
    services: [
      { icon: "🐕", name: "Daily Care", desc: "Walks, feeding, playtime, and companionship on a schedule that fits your pet's routine." },
      { icon: "✂️", name: "Grooming", desc: "Gentle, professional grooming that keeps your pet healthy, comfortable, and looking great." },
      { icon: "🏠", name: "Boarding & Sitting", desc: "Safe, comfortable overnight care — at our place or yours — with daily photo updates." },
      { icon: "🎓", name: "Training", desc: "Positive, effective training that builds good habits and a stronger bond." },
      { icon: "🚨", name: "Flexible & Reliable", desc: "Last-minute needs, odd schedules, special requirements — we make it work." },
      { icon: "📸", name: "Updates Every Visit", desc: "Photos and notes after every visit, because you deserve to know they're happy." },
    ],
    stats: [["1K+", "Happy pets"], ["100%", "Insured & trained"], ["5★", "Pet parent rating"], ["7 days", "A week"]],
    reviews: [
      ["My anxious rescue absolutely adores them. I've never trusted anyone with him before.", "Steph R.", "Dog mom"],
      ["The photo updates make my workday. Professional, loving care every single time.", "Ben C.", "Pet parent"],
      ["Grooming is gentle and gorgeous. My pup actually gets excited when we arrive.", "Ana F.", "Client"],
    ],
    ctaTitle: "Book your pet's first visit",
    ctaSub: "New clients get a free meet-and-greet — let's make sure it's a perfect fit.",
    ctaButton: "Book a meet & greet",
  },

  photography: {
    keywords: ["photograph", "photo studio", "videograph", "portrait", "headshot"],
    palette: "charcoal", fonts: "elegant",
    heroHeadline: "Moments, made timeless",
    heroSub: "{name} captures the images you'll treasure forever — with an artist's eye, professional gear, and an experience that feels effortless.",
    aboutTitle: "Behind the lens",
    about: [
      "{name} believes photography is about more than pictures — it's about preserving how a moment felt. We bring technical mastery and a calm, friendly presence to every shoot.",
      "From the first consultation to final delivery, we make the process easy and the results extraordinary. Your only job is to be there — we'll handle the rest."
    ],
    services: [
      { icon: "📷", name: "Portraits & Headshots", desc: "Professional portraits that capture personality — for families, professionals, and personal brands." },
      { icon: "💍", name: "Weddings & Events", desc: "Complete coverage of your biggest days, from candid moments to formal portraits." },
      { icon: "🏢", name: "Commercial & Branding", desc: "Product, brand, and business photography that elevates your marketing." },
      { icon: "🎞️", name: "Video & Motion", desc: "Cinematic video that tells your story with polish and emotion." },
      { icon: "🖼️", name: "Editing & Retouching", desc: "Meticulous professional editing on every delivered image — never rushed, never over-done." },
      { icon: "⚡", name: "Fast Delivery", desc: "Sneak peeks within days and full galleries on a clear, reliable timeline." },
    ],
    stats: [["400+", "Shoots completed"], ["10+", "Years behind the lens"], ["48h", "Sneak peeks"], ["5★", "Client rating"]],
    reviews: [
      ["The photos made me cry — in the best way. Every important moment, captured perfectly.", "Nicole & Dan", "Wedding clients"],
      ["Our team headshots have never looked better. Quick, professional, and fun.", "HR team", "Corporate client"],
      ["Somehow got my toddler to smile naturally in every shot. Actual magic.", "Whitney S.", "Family client"],
    ],
    ctaTitle: "Let's plan your shoot",
    ctaSub: "Dates book quickly — reach out with your vision and we'll make it happen.",
    ctaButton: "Check availability",
  },

  transport: {
    keywords: ["moving", "movers", "logistics", "delivery", "courier", "freight", "trucking", "shipping", "transport", "limo", "taxi", "shuttle"],
    palette: "midnight", fonts: "bold",
    heroHeadline: "On time. Every time.",
    heroSub: "{name} moves what matters with careful handling, transparent pricing, and reliability you can set your watch to.",
    aboutTitle: "Reliability is the whole job",
    about: [
      "{name} was built on one metric: did it arrive safely and on time? Everything we do — training, equipment, routing, communication — serves that single promise.",
      "Our team is background-checked, our vehicles are maintained, and our quotes are honest. That's why customers use us once and never look elsewhere again."
    ],
    services: [
      { icon: "🚚", name: "Core Services", desc: "Careful, efficient service for jobs of every size — handled by trained, background-checked professionals." },
      { icon: "📦", name: "Careful Handling", desc: "Proper equipment, padding, and technique so everything arrives exactly as it left." },
      { icon: "🗺️", name: "Local & Long Distance", desc: "Across town or across the state — same care, same communication, same reliability." },
      { icon: "💵", name: "Transparent Pricing", desc: "Clear, upfront quotes with no hidden fees or surprise charges at the end." },
      { icon: "📍", name: "Real-Time Updates", desc: "Know exactly where things stand with proactive status updates at every stage." },
      { icon: "🛡️", name: "Fully Insured", desc: "Licensed and insured with real coverage — your property is protected door to door." },
    ],
    stats: [["5K+", "Jobs completed"], ["99%", "On-time rate"], ["100%", "Licensed & insured"], ["4.9★", "Customer rating"]],
    reviews: [
      ["Showed up on time, handled everything with care, and finished ahead of estimate.", "Ron W.", "Customer"],
      ["The only company I trust after two bad experiences elsewhere. Total professionals.", "Felicia G.", "Customer"],
      ["Transparent quote, careful crew, zero damage. Exactly what you want.", "Ian K.", "Customer"],
    ],
    ctaTitle: "Get a free quote",
    ctaSub: "Tell us what you need moved and when — we'll send an honest quote fast.",
    ctaButton: "Get my quote",
  },
};

/* Specific industries — higher-priority matches that fine-tune
   the category content with a more precise label and palette. */
const INDUSTRIES = [
  { keywords: ["graphic design", "graphic designer"], category: "creative", label: "Graphic Design", palette: "plum", fonts: "bold" },
  { keywords: ["interior design", "interior decorator"], category: "creative", label: "Interior Design", palette: "gold", fonts: "elegant" },
  { keywords: ["marketing", "advertising", "seo", "social media"], category: "creative", label: "Marketing", palette: "indigo", fonts: "modern" },
  { keywords: ["architecture", "architect"], category: "creative", label: "Architecture", palette: "slate", fonts: "elegant" },

  { keywords: ["construction", "general contractor", "home builder"], category: "trades", label: "Construction", palette: "terra", fonts: "bold" },
  { keywords: ["roofing", "roofer"], category: "trades", label: "Roofing", palette: "crimson", fonts: "bold" },
  { keywords: ["plumbing", "plumber"], category: "trades", label: "Plumbing", palette: "ocean", fonts: "friendly" },
  { keywords: ["electrician", "electrical"], category: "trades", label: "Electrical", palette: "gold", fonts: "bold" },
  { keywords: ["landscaping", "lawn care", "landscaper", "tree service"], category: "trades", label: "Landscaping", palette: "forest", fonts: "friendly" },
  { keywords: ["hvac", "heating", "air conditioning"], category: "trades", label: "HVAC", palette: "midnight", fonts: "modern" },
  { keywords: ["painting", "painter"], category: "trades", label: "Painting", palette: "teal", fonts: "friendly" },

  { keywords: ["accounting", "accountant", "cpa", "bookkeeping", "tax"], category: "professional", label: "Accounting", palette: "midnight", fonts: "modern" },
  { keywords: ["law", "attorney", "legal", "lawyer", "law firm"], category: "professional", label: "Legal", palette: "slate", fonts: "classic" },
  { keywords: ["consulting", "consultant", "business consult"], category: "professional", label: "Consulting", palette: "indigo", fonts: "modern" },
  { keywords: ["insurance"], category: "professional", label: "Insurance", palette: "ocean", fonts: "friendly" },
  { keywords: ["financial", "wealth", "investment advisor", "financial planner"], category: "professional", label: "Financial Services", palette: "forest", fonts: "modern" },

  { keywords: ["dental", "dentist", "orthodont"], category: "health", label: "Dental", palette: "teal", fonts: "friendly" },
  { keywords: ["chiropractic", "chiropractor"], category: "health", label: "Chiropractic", palette: "ocean", fonts: "friendly" },
  { keywords: ["therapy", "counseling", "therapist", "mental health"], category: "health", label: "Therapy & Counseling", palette: "teal", fonts: "elegant" },
  { keywords: ["veterinary", "veterinarian", "vet clinic"], category: "health", label: "Veterinary", palette: "forest", fonts: "friendly" },
  { keywords: ["massage"], category: "health", label: "Massage Therapy", palette: "gold", fonts: "elegant" },

  { keywords: ["restaurant", "bistro", "grill", "diner", "eatery"], category: "food", label: "Restaurant", palette: "crimson", fonts: "elegant" },
  { keywords: ["coffee", "cafe", "café"], category: "food", label: "Café", palette: "terra", fonts: "friendly" },
  { keywords: ["bakery", "baker", "pastry"], category: "food", label: "Bakery", palette: "rose", fonts: "elegant" },
  { keywords: ["catering", "caterer"], category: "food", label: "Catering", palette: "gold", fonts: "elegant" },
  { keywords: ["food truck"], category: "food", label: "Food Truck", palette: "crimson", fonts: "bold" },

  { keywords: ["barber", "barbershop"], category: "personalCare", label: "Barbershop", palette: "charcoal", fonts: "bold" },
  { keywords: ["salon", "hair stylist", "hairdresser"], category: "personalCare", label: "Salon", palette: "rose", fonts: "elegant" },
  { keywords: ["nail"], category: "personalCare", label: "Nail Studio", palette: "rose", fonts: "friendly" },
  { keywords: ["spa", "esthetician", "skincare"], category: "personalCare", label: "Spa & Skincare", palette: "gold", fonts: "elegant" },
  { keywords: ["tattoo"], category: "personalCare", label: "Tattoo Studio", palette: "charcoal", fonts: "bold" },

  { keywords: ["music", "musician", "band", "dj", "producer", "recording studio"], category: "music", label: "Music", palette: "plum", fonts: "bold" },
  { keywords: ["photography", "photographer", "videography", "videographer"], category: "photography", label: "Photography", palette: "charcoal", fonts: "elegant" },
  { keywords: ["real estate", "realtor", "realty", "property management"], category: "realEstate", label: "Real Estate", palette: "slate", fonts: "elegant" },
  { keywords: ["cleaning", "maid", "janitorial", "pressure wash"], category: "cleaning", label: "Cleaning Services", palette: "ocean", fonts: "friendly" },
  { keywords: ["pet", "dog groom", "dog walk", "boarding", "kennel"], category: "petCare", label: "Pet Care", palette: "forest", fonts: "friendly" },
  { keywords: ["moving", "movers"], category: "transport", label: "Moving Services", palette: "midnight", fonts: "bold" },
  { keywords: ["auto repair", "mechanic", "auto shop", "car detail", "auto detail", "tire shop", "body shop"], category: "automotive", label: "Automotive", palette: "charcoal", fonts: "bold" },
  { keywords: ["gym", "fitness", "personal train", "crossfit", "yoga", "pilates"], category: "fitness", label: "Fitness", palette: "charcoal", fonts: "bold" },
  { keywords: ["tutoring", "tutor", "test prep", "academy", "learning center"], category: "education", label: "Education", palette: "indigo", fonts: "friendly" },
  { keywords: ["wedding plan", "event plan", "party plan"], category: "events", label: "Event Planning", palette: "gold", fonts: "elegant" },
  { keywords: ["software", "web design", "web develop", "app develop", "it services", "it support", "managed service"], category: "tech", label: "Technology", palette: "midnight", fonts: "modern" },
];

/* Generic fallback for business types nothing else matches.
   Still produces credible, professional content. */
const GENERIC_PROFILE = {
  palette: "indigo", fonts: "modern",
  heroHeadline: "Professional {type} services you can trust",
  heroSub: "{name} delivers quality {type} services with professionalism, clear communication, and results that speak for themselves.",
  aboutTitle: "About {name}",
  about: [
    "{name} was founded with a clear mission: deliver exceptional {type} services with honesty, skill, and genuine care for every client. We believe great work starts with listening — understanding exactly what you need before we ever get started.",
    "What sets us apart is consistency. We communicate clearly, deliver on our promises, and treat every client's goals like our own. That's how we've built lasting relationships and a reputation we're proud of."
  ],
  services: [
    { icon: "⭐", name: "Core Services", desc: "Our flagship offerings, refined through years of experience and delivered to a consistently high standard." },
    { icon: "🎯", name: "Tailored Solutions", desc: "Every client is different. We adapt our approach to your specific needs, goals, and budget." },
    { icon: "💬", name: "Free Consultations", desc: "Start with a no-obligation conversation. We'll listen, assess, and recommend the right path forward." },
    { icon: "⚡", name: "Fast Turnaround", desc: "Realistic timelines, proactive updates, and delivery when we say — your time matters to us." },
    { icon: "🛡️", name: "Quality Guaranteed", desc: "We stand behind every job. If something isn't right, we'll make it right." },
    { icon: "🤝", name: "Ongoing Support", desc: "Our relationship doesn't end at delivery. Count on us for follow-up support whenever you need it." },
  ],
  stats: [["100+", "Happy clients"], ["10+", "Years of experience"], ["100%", "Satisfaction focused"], ["24h", "Response time"]],
  reviews: [
    ["Professional, responsive, and excellent at what they do. Couldn't ask for more.", "Alex J.", "Client"],
    ["They delivered exactly what was promised, on time and on budget. Rare and refreshing.", "Sam P.", "Client"],
    ["Great communication from start to finish. I recommend them to everyone.", "Taylor R.", "Client"],
  ],
  ctaTitle: "Ready to get started?",
  ctaSub: "Reach out today for a free, no-obligation consultation.",
  ctaButton: "Get in touch",
};

/* ---------- research API ---------- */

function scoreKeywords(text, keywords) {
  let score = 0;
  for (const kw of keywords) {
    if (text.includes(kw)) score += kw.length; // longer matches are more specific
  }
  return score;
}

/**
 * Research a free-text business type and return a full content profile.
 * Never fails — always returns usable, professional content.
 */
function researchBusiness(businessType) {
  const text = " " + businessType.trim().toLowerCase() + " ";

  // 1) Specific industry match
  let bestIndustry = null, bestIndustryScore = 0;
  for (const ind of INDUSTRIES) {
    const s = scoreKeywords(text, ind.keywords);
    if (s > bestIndustryScore) { bestIndustryScore = s; bestIndustry = ind; }
  }

  // 2) Category match
  let bestCategory = null, bestCategoryKey = null, bestCategoryScore = 0;
  for (const [key, cat] of Object.entries(CATEGORIES)) {
    const s = scoreKeywords(text, cat.keywords);
    if (s > bestCategoryScore) { bestCategoryScore = s; bestCategory = cat; bestCategoryKey = key; }
  }

  if (bestIndustry) {
    const base = CATEGORIES[bestIndustry.category];
    return {
      matchType: "industry",
      matchLabel: bestIndustry.label,
      categoryKey: bestIndustry.category,
      ...base,
      palette: bestIndustry.palette || base.palette,
      fonts: bestIndustry.fonts || base.fonts,
    };
  }

  if (bestCategory) {
    return { matchType: "category", matchLabel: bestCategoryKey, categoryKey: bestCategoryKey, ...bestCategory };
  }

  return { matchType: "generic", matchLabel: "general business", categoryKey: "generic", ...GENERIC_PROFILE };
}

export { PALETTES, FONT_PAIRS, researchBusiness };
