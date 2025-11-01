// Full Monopoly-like board data (40 squares) — satirical economic misery edition
const BOARD_SQUARES = [
  {
    name: "GO (Barely Surviving)",
    type: "corner",
    action: "collect",
    description: "Collect $200 (which covers about 1/4 of your electric bill)",
    review:
      "‘Ah yes, payday. Time to immediately hand it all to rent.’ – Every player ever",
  },
  {
    name: "Studio Apartment (with shared air)",
    type: "property",
    price: 650000,
    color: "#8B4513",
    review:
      "‘Loved how the walls were thin enough to hear my neighbor’s despair.’ – 1/5 stars",
  },
  {
    name: "Community Chest (Tax Refund Denied)",
    type: "chest",
    review: "‘The only community here is shared financial ruin.’ – Anonymous",
  },
  {
    name: "Dumpster Loft (Downtown Vibes)",
    type: "property",
    price: 720000,
    color: "#8B4513",
    review:
      "‘Cozy if you enjoy raccoon roommates and existential dread.’ – Former tenant",
  },
  {
    name: "Income Tax (We Took It All)",
    type: "tax",
    price: 99999,
    review:
      "‘The government thanks you for your involuntary contribution.’ – Treasury Dept.",
  },
  {
    name: "Crypto Transit Line",
    type: "railroad",
    price: 1200000,
    review:
      "‘Ticket costs more than my car. Train still late.’ – Commuter #404",
  },
  {
    name: "Gentrified Alleyway",
    type: "property",
    price: 850000,
    color: "#87CEFA",
    review:
      "‘Used to be affordable. Then they added fairy lights.’ – Local artist (displaced)",
  },
  {
    name: "Chance (Hope & Denial)",
    type: "chance",
    review: "‘Rolled the dice and lost my savings again.’ – Average millennial",
  },
  {
    name: "Tiny Home (Literally a Shed)",
    type: "property",
    price: 940000,
    color: "#87CEFA",
    review: "‘Minimalist living, maximalist debt.’ – Proud owner (in denial)",
  },
  {
    name: "Cardboard Condo",
    type: "property",
    price: 1000000,
    color: "#87CEFA",
    review:
      "‘Love the open-air concept. It’s missing all four walls.’ – 2/5 stars",
  },
  {
    name: "Jail / Just Visiting (aka College Debt)",
    type: "corner",
    review:
      "‘Locked up, but at least no rent due this turn.’ – Relieved graduate",
  },
  {
    name: "Influencer Street",
    type: "property",
    price: 1500000,
    color: "#FF69B4",
    review:
      "‘Every house has a ring light. Everyone has an ego.’ – 3/5 stars, needs authenticity",
  },
  {
    name: "Streaming Service Utility",
    type: "utility",
    price: 30000,
    review:
      "‘Costs more than cable, but at least I can binge in 4K sadness.’ – Subscriber #2034",
  },
  {
    name: "NFT Boulevard",
    type: "property",
    price: 1600000,
    color: "#FF69B4",
    review:
      "‘Paid $1.6M for a pixelated monkey mural. Still worth less than my dignity.’ – Collector",
  },
  {
    name: "Payday Loan Plaza",
    type: "property",
    price: 1750000,
    color: "#FF69B4",
    review:
      "‘Come for the loan, stay for the lifetime of regret.’ – Repeat customer",
  },
  {
    name: "Pennsylvania Railfail",
    type: "railroad",
    price: 1100000,
    review:
      "‘Luxury experience if you consider standing in delays luxurious.’ – Daily commuter",
  },
  {
    name: "Avocado Toast Avenue",
    type: "property",
    price: 1900000,
    color: "#FFA500",
    review:
      "‘Could’ve bought a house if I didn’t buy brunch here.’ – Regretful millennial",
  },
  {
    name: "Community Chest (Oops, Student Loan Adjustment)",
    type: "chest",
    review:
      "‘Opened it hoping for relief. Found a reminder notice instead.’ – Crushed dreamer",
  },
  {
    name: "Side Hustle Street",
    type: "property",
    price: 2100000,
    color: "#FFA500",
    review: "‘Worked 6 jobs and still can’t afford the sidewalk.’ – Gig worker",
  },
  {
    name: "Startup Burnout Blvd",
    type: "property",
    price: 2400000,
    color: "#FFA500",
    review:
      "‘Everyone talks about innovation until payroll day.’ – Former founder",
  },
  {
    name: "Free Parking (Costs $75/hr)",
    type: "corner",
    review: "‘They charged me to look at the parking spot.’ – Furious driver",
  },
  {
    name: "Red Flag Road",
    type: "property",
    price: 2700000,
    color: "#FF0000",
    review:
      "‘Beautiful place, terrible people, all dating coaches.’ – Ex-resident",
  },
  {
    name: "Chance (You Got Laid Off)",
    type: "chance",
    review: "‘At least the dice didn’t ghost me.’ – Former employee",
  },
  {
    name: "Housing Bubble Heights",
    type: "property",
    price: 2800000,
    color: "#FF0000",
    review: "‘Bought high, sold never.’ – Proud yet crying homeowner",
  },
  {
    name: "Tech Layoff Lane",
    type: "property",
    price: 3000000,
    color: "#FF0000",
    review:
      "‘Comes with complimentary burnout and a pink slip.’ – Former coder",
  },
  {
    name: "B. & O. Railroad (Now a Podcast)",
    type: "railroad",
    price: 1300000,
    review:
      "‘Just two guys talking about trains and late-stage capitalism.’ – Listener",
  },
  {
    name: "Gluten-Free Gardens",
    type: "property",
    price: 3200000,
    color: "#FFFF00",
    review: "‘The grass is organic, the rent is not.’ – Health guru",
  },
  {
    name: "Crypto Crash Court",
    type: "property",
    price: 3300000,
    color: "#FFFF00",
    review:
      "‘Was worth $10M yesterday. Today? Just vibes.’ – Investor (RIP wallet)",
  },
  {
    name: "Water Works (Now Bottled & Sold)",
    type: "utility",
    price: 850000,
    review:
      "‘They charge you extra for the “eco-friendly” label.’ – Thirsty consumer",
  },
  {
    name: "Marvin’s AI Mansion",
    type: "property",
    price: 3500000,
    color: "#FFFF00",
    review:
      "‘The fridge tried to unionize. I respect that.’ – Overwhelmed owner",
  },
  {
    name: "Go To Jail (Do Not Pass Therapy)",
    type: "corner",
    review:
      "‘At least prison food doesn’t have service fees.’ – Repeat visitor",
  },
  {
    name: "Pacific Inflation Avenue",
    type: "property",
    price: 3700000,
    color: "#008000",
    review: "‘Everything’s inflated, even my hopes.’ – Local economist",
  },
  {
    name: "North Carolina Crypto Colony",
    type: "property",
    price: 4000000,
    color: "#008000",
    review:
      "‘Our HOA meetings are just panic attacks in suits.’ – Member since 2021",
  },
  {
    name: "Community Chest (Go Fund Yourself)",
    type: "chest",
    review: "‘Crowdfunded my rent. Raised $12.50.’ – Optimist",
  },
  {
    name: "Pennsylvania Avenue (Now for Billionaires Only)",
    type: "property",
    price: 4500000,
    color: "#008000",
    review:
      "‘Security asked me to leave before I finished parking.’ – Peasant reviewer",
  },
  {
    name: "Short Line (Actually Short on Funds)",
    type: "railroad",
    price: 1500000,
    review: "‘Tickets priced by Jeff Bezos himself.’ – Commuter",
  },
  {
    name: "Chance (Rent Due Again)",
    type: "chance",
    review: "‘Rolled the dice, rolled into debt.’ – Tenant",
  },
  {
    name: "Parked Place (Because You Can’t Afford a House)",
    type: "property",
    price: 5000000,
    color: "#00008B",
    review:
      "‘Slept here in my car. 5 stars, great view of Boardbroke.’ – Vanlifer",
  },
  {
    name: "Luxury Tax (For Breathing Air)",
    type: "tax",
    price: 250000,
    review: "‘You exhaled. That’ll be $250, please.’ – Government",
  },
  {
    name: "Boardbroke",
    type: "property",
    price: 6000000,
    color: "#00008B",
    review: "‘The dream. The debt. The downfall.’ – Aspirational renter",
  },
];

// Number of squares on each side (excluding corners)
const SQUARES_PER_SIDE = 9;
