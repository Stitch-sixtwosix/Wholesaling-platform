import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/password";

const prisma = new PrismaClient();

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

async function main() {
  console.log("Seeding database…");

  // Wipe (order matters for FK)
  await prisma.activity.deleteMany();
  await prisma.task.deleteMany();
  await prisma.campaignMember.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.template.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.comp.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.property.deleteMany();
  await prisma.buyer.deleteMany();
  await prisma.user.deleteMany();

  // Users — with login credentials (demo passwords)
  const admin = await prisma.user.create({
    data: {
      name: "Jordan Pierce",
      email: "jordan@wholesaleos.com",
      role: "admin",
      passwordHash: hashPassword("admin123"),
    },
  });
  const acq = await prisma.user.create({
    data: {
      name: "Maya Chen",
      email: "maya@wholesaleos.com",
      role: "acquisitions",
      passwordHash: hashPassword("acq123"),
    },
  });
  const dispo = await prisma.user.create({
    data: {
      name: "Devon Brooks",
      email: "devon@wholesaleos.com",
      role: "dispositions",
      passwordHash: hashPassword("dispo123"),
    },
  });

  // Properties
  const propData = [
    { address: "2841 Maple Grove Dr", city: "Memphis", state: "TN", zip: "38109", beds: 3, baths: 2, sqft: 1450, yearBuilt: 1968, condition: "distressed", occupancy: "vacant", arv: 185000, repairEstimate: 42000, estimatedValue: 110000 },
    { address: "915 Sycamore St", city: "Cleveland", state: "OH", zip: "44109", beds: 4, baths: 2, sqft: 1820, yearBuilt: 1955, condition: "poor", occupancy: "owner", arv: 142000, repairEstimate: 35000, estimatedValue: 88000 },
    { address: "6720 Birchwood Ln", city: "Tampa", state: "FL", zip: "33610", beds: 3, baths: 1, sqft: 1190, yearBuilt: 1972, condition: "fair", occupancy: "tenant", arv: 268000, repairEstimate: 28000, estimatedValue: 205000 },
    { address: "412 Hickory Ave", city: "Indianapolis", state: "IN", zip: "46201", beds: 2, baths: 1, sqft: 980, yearBuilt: 1948, condition: "distressed", occupancy: "vacant", arv: 158000, repairEstimate: 38000, estimatedValue: 92000 },
    { address: "1130 Elmwood Cir", city: "Birmingham", state: "AL", zip: "35211", beds: 3, baths: 2, sqft: 1560, yearBuilt: 1979, condition: "fair", occupancy: "owner", arv: 175000, repairEstimate: 25000, estimatedValue: 128000 },
    { address: "88 Cedar Point Rd", city: "Kansas City", state: "MO", zip: "64127", beds: 4, baths: 3, sqft: 2100, yearBuilt: 1962, condition: "poor", occupancy: "vacant", arv: 245000, repairEstimate: 55000, estimatedValue: 140000 },
    { address: "503 Willow Bend", city: "Columbus", state: "OH", zip: "43207", beds: 3, baths: 2, sqft: 1380, yearBuilt: 1985, condition: "good", occupancy: "tenant", arv: 215000, repairEstimate: 18000, estimatedValue: 178000 },
    { address: "2207 Pinecrest Dr", city: "Memphis", state: "TN", zip: "38127", beds: 3, baths: 1, sqft: 1240, yearBuilt: 1958, condition: "distressed", occupancy: "vacant", arv: 165000, repairEstimate: 45000, estimatedValue: 78000 },
  ];
  const properties = [];
  for (const p of propData) {
    properties.push(await prisma.property.create({ data: { ...p, county: "—" } }));
  }

  // Comps for the first property
  await prisma.comp.createMany({
    data: [
      { propertyId: properties[0].id, address: "2910 Maple Grove Dr", salePrice: 192000, saleDate: daysAgo(45), beds: 3, baths: 2, sqft: 1500, distanceMi: 0.2 },
      { propertyId: properties[0].id, address: "2755 Oakhaven Rd", salePrice: 178000, saleDate: daysAgo(70), beds: 3, baths: 2, sqft: 1410, distanceMi: 0.4 },
      { propertyId: properties[0].id, address: "3001 Maple Grove Dr", salePrice: 188000, saleDate: daysAgo(30), beds: 3, baths: 2, sqft: 1480, distanceMi: 0.3 },
    ],
  });

  // Leads (sellers)
  const leadData = [
    { firstName: "Robert", lastName: "Hayes", phone: "(901) 555-0142", email: "rhayes@email.com", status: "under_contract", source: "direct_mail", motivation: "inherited", temperature: "hot", askingPrice: 95000, propertyIdx: 0, ownerId: acq.id },
    { firstName: "Linda", lastName: "Morrison", phone: "(216) 555-0177", email: "lmorrison@email.com", status: "appointment", source: "ppc", motivation: "tired_landlord", temperature: "hot", askingPrice: 80000, propertyIdx: 1, ownerId: acq.id },
    { firstName: "James", lastName: "Whitfield", phone: "(813) 555-0193", status: "qualified", source: "cold_call", motivation: "relocation", temperature: "warm", askingPrice: 220000, propertyIdx: 2, ownerId: acq.id },
    { firstName: "Patricia", lastName: "Nguyen", phone: "(317) 555-0118", email: "pnguyen@email.com", status: "offer_made", source: "driving_for_dollars", motivation: "vacant", temperature: "hot", askingPrice: 85000, propertyIdx: 3, ownerId: admin.id },
    { firstName: "Carlos", lastName: "Mendez", phone: "(205) 555-0166", status: "contacted", source: "sms", motivation: "financial", temperature: "warm", askingPrice: 130000, propertyIdx: 4, ownerId: acq.id },
    { firstName: "Sandra", lastName: "Boyd", phone: "(816) 555-0149", email: "sboyd@email.com", status: "new", source: "list", motivation: "foreclosure", temperature: "hot", askingPrice: 150000, propertyIdx: 5, ownerId: acq.id },
    { firstName: "Michael", lastName: "Tran", phone: "(614) 555-0125", status: "nurture", source: "referral", motivation: "divorce", temperature: "cold", askingPrice: 185000, propertyIdx: 6, ownerId: admin.id },
    { firstName: "Denise", lastName: "Foster", phone: "(901) 555-0188", status: "new", source: "bandit_sign", motivation: "repairs", temperature: "warm", askingPrice: 70000, propertyIdx: 7, ownerId: acq.id },
    { firstName: "Gary", lastName: "Sullivan", phone: "(901) 555-0201", status: "dead", source: "ppc", motivation: "other", temperature: "cold", askingPrice: 250000, propertyIdx: null, ownerId: acq.id },
  ];
  const leads = [];
  for (const l of leadData) {
    const { propertyIdx, ...rest } = l;
    leads.push(
      await prisma.lead.create({
        data: {
          ...rest,
          propertyId: propertyIdx !== null ? properties[propertyIdx].id : null,
          lastContact: daysAgo(Math.floor(Math.random() * 14)),
          createdAt: daysAgo(Math.floor(Math.random() * 60) + 1),
        },
      })
    );
  }

  // Buyers (dispositions)
  const buyerData = [
    { firstName: "Amir", lastName: "Khan", company: "Bluestone Capital", email: "amir@bluestone.com", phone: "(901) 555-0301", buyerType: "flipper", status: "vip", proofOfFunds: true, markets: "Memphis, Nashville", propertyTypes: "single_family, townhouse", minPrice: 50000, maxPrice: 180000, minBeds: 3, maxRehab: 60000 },
    { firstName: "Rachel", lastName: "Okonkwo", company: "Evergreen Rentals", email: "rachel@evergreen.com", phone: "(216) 555-0312", buyerType: "landlord", status: "vip", proofOfFunds: true, markets: "Cleveland, Columbus, Indianapolis", propertyTypes: "single_family, multi_family", minPrice: 40000, maxPrice: 150000, minBeds: 2, maxRehab: 40000 },
    { firstName: "Tony", lastName: "Russo", company: "Sunbelt Flips", email: "tony@sunbeltflips.com", phone: "(813) 555-0323", buyerType: "flipper", status: "active", proofOfFunds: true, markets: "Tampa, Orlando", propertyTypes: "single_family, condo", minPrice: 120000, maxPrice: 350000, minBeds: 3, maxRehab: 50000 },
    { firstName: "Grace", lastName: "Liu", company: "Midwest Holdings", email: "grace@midwesth.com", phone: "(317) 555-0334", buyerType: "landlord", status: "active", proofOfFunds: true, markets: "Indianapolis, Kansas City", propertyTypes: "single_family", minPrice: 50000, maxPrice: 130000, minBeds: 2, maxRehab: 45000 },
    { firstName: "Marcus", lastName: "Webb", company: "Iron Oak Investments", email: "marcus@ironoak.com", phone: "(205) 555-0345", buyerType: "flipper", status: "active", proofOfFunds: false, markets: "Birmingham", propertyTypes: "single_family", minPrice: 60000, maxPrice: 160000, minBeds: 3, maxRehab: 35000 },
    { firstName: "Nina", lastName: "Patel", company: "Skyline Acquisitions", email: "nina@skyline.com", phone: "(816) 555-0356", buyerType: "hedge_fund", status: "vip", proofOfFunds: true, markets: "Kansas City, Memphis, Birmingham", propertyTypes: "single_family, multi_family", minPrice: 80000, maxPrice: 300000, minBeds: 3, maxRehab: 70000 },
  ];
  const buyers = [];
  for (const b of buyerData) {
    buyers.push(await prisma.buyer.create({ data: { ...b, cashBuyer: true } }));
  }

  // Deals
  const dealData = [
    { title: "2841 Maple Grove Dr — Memphis", stage: "under_contract", status: "active", leadIdx: 0, propertyIdx: 0, buyerIdx: 0, arv: 185000, repairEstimate: 42000, contractPrice: 88000, resalePrice: 100000, assignmentFee: 12000, ownerId: acq.id, expectedCloseDate: daysFromNow(12) },
    { title: "412 Hickory Ave — Indianapolis", stage: "offer", status: "active", leadIdx: 3, propertyIdx: 3, buyerIdx: 3, arv: 158000, repairEstimate: 38000, contractPrice: 72000, assignmentFee: 10000, ownerId: admin.id, expectedCloseDate: daysFromNow(25) },
    { title: "915 Sycamore St — Cleveland", stage: "appointment", status: "active", leadIdx: 1, propertyIdx: 1, arv: 142000, repairEstimate: 35000, contractPrice: 68000, ownerId: acq.id, expectedCloseDate: daysFromNow(30) },
    { title: "6720 Birchwood Ln — Tampa", stage: "contacted", status: "active", leadIdx: 2, propertyIdx: 2, arv: 268000, repairEstimate: 28000, ownerId: acq.id },
    { title: "88 Cedar Point Rd — Kansas City", stage: "lead", status: "active", leadIdx: 5, propertyIdx: 5, arv: 245000, repairEstimate: 55000, ownerId: acq.id },
    { title: "1130 Elmwood Cir — Birmingham", stage: "closed", status: "won", leadIdx: 4, propertyIdx: 4, buyerIdx: 4, arv: 175000, repairEstimate: 25000, contractPrice: 105000, resalePrice: 118000, assignmentFee: 13000, ownerId: acq.id, closedDate: daysAgo(8) },
    { title: "2207 Pinecrest Dr — Memphis", stage: "assigned", status: "active", leadIdx: 7, propertyIdx: 7, buyerIdx: 0, arv: 165000, repairEstimate: 45000, contractPrice: 62000, resalePrice: 71500, assignmentFee: 9500, ownerId: acq.id, expectedCloseDate: daysFromNow(5) },
    { title: "503 Willow Bend — Columbus", stage: "dead", status: "lost", leadIdx: 6, propertyIdx: 6, arv: 215000, repairEstimate: 18000, ownerId: admin.id },
  ];
  const deals = [];
  for (const d of dealData) {
    const { leadIdx, propertyIdx, buyerIdx, ...rest } = d;
    deals.push(
      await prisma.deal.create({
        data: {
          ...rest,
          leadId: leadIdx !== undefined ? leads[leadIdx].id : null,
          propertyId: propertyIdx !== undefined ? properties[propertyIdx].id : null,
          buyerId: buyerIdx !== undefined ? buyers[buyerIdx].id : null,
          createdAt: daysAgo(Math.floor(Math.random() * 45) + 1),
        },
      })
    );
  }

  // Templates
  const smsTemplate = await prisma.template.create({
    data: {
      name: "Cold Seller — First Touch",
      channel: "sms",
      body: "Hi {{firstName}}, I'm a local investor interested in your property at {{address}}. Would you consider a cash offer with a flexible closing date? — {{agent}}",
    },
  });
  const emailTemplate = await prisma.template.create({
    data: {
      name: "New Deal Blast",
      channel: "email",
      subject: "🔥 Off-Market Deal: {{address}} — {{arv}} ARV",
      body: "Hi {{firstName}},\n\nNew off-market opportunity:\n\nAddress: {{address}}\nARV: {{arv}}\nRepairs: {{repairs}}\nAsking: {{price}}\n\nReply FAST — these go quick. Proof of funds required.\n\n{{agent}}",
    },
  });
  await prisma.template.create({
    data: {
      name: "Direct Mail — Yellow Letter",
      channel: "direct_mail",
      body: "Dear {{firstName}}, I would like to buy your house at {{address}}. I can pay cash and close quickly. Please call me at {{phone}}.",
    },
  });

  // Campaigns
  await prisma.campaign.create({
    data: { name: "Memphis Absentee Owners — Q2", channel: "sms", status: "active", audience: "2,400 absentee owners, 38109/38127", sent: 2400, delivered: 2210, responses: 168, leads: 42, cost: 480, templateId: smsTemplate.id, startDate: daysAgo(20) },
  });
  await prisma.campaign.create({
    data: { name: "Cleveland Pre-Foreclosure Mailer", channel: "direct_mail", status: "active", audience: "850 pre-foreclosure, Cuyahoga County", sent: 850, delivered: 820, responses: 31, leads: 11, cost: 1275, startDate: daysAgo(35) },
  });
  await prisma.campaign.create({
    data: { name: "VIP Buyer Deal Blast", channel: "email", status: "active", audience: "Cash buyers list (6)", sent: 6, delivered: 6, responses: 4, leads: 0, cost: 0, templateId: emailTemplate.id, startDate: daysAgo(3) },
  });
  await prisma.campaign.create({
    data: { name: "Tampa Cold Call Sprint", channel: "cold_call", status: "completed", audience: "1,100 high-equity, Hillsborough", sent: 1100, delivered: 640, responses: 95, leads: 18, cost: 900, startDate: daysAgo(50), endDate: daysAgo(20) },
  });
  await prisma.campaign.create({
    data: { name: "Birmingham RVM Drop", channel: "rvm", status: "draft", audience: "1,800 tired landlords", sent: 0, delivered: 0, responses: 0, leads: 0, cost: 0 },
  });

  // Contracts
  await prisma.contract.create({
    data: { type: "purchase", title: "Purchase — 2841 Maple Grove Dr", status: "executed", dealId: deals[0].id, buyerName: "WholesaleOS LLC", sellerName: "Robert Hayes", propertyAddress: "2841 Maple Grove Dr, Memphis, TN 38109", purchasePrice: 88000, earnestMoney: 1000, inspectionDays: 10, closingDate: daysFromNow(12), signedDate: daysAgo(5) },
  });
  await prisma.contract.create({
    data: { type: "assignment", title: "Assignment — 2841 Maple Grove Dr", status: "signed", dealId: deals[0].id, buyerName: "Bluestone Capital", sellerName: "WholesaleOS LLC", propertyAddress: "2841 Maple Grove Dr, Memphis, TN 38109", purchasePrice: 88000, assignmentFee: 12000, closingDate: daysFromNow(12), signedDate: daysAgo(2) },
  });
  await prisma.contract.create({
    data: { type: "purchase", title: "Purchase — 1130 Elmwood Cir", status: "executed", dealId: deals[5].id, buyerName: "WholesaleOS LLC", sellerName: "Carlos Mendez", propertyAddress: "1130 Elmwood Cir, Birmingham, AL 35211", purchasePrice: 105000, earnestMoney: 1000, inspectionDays: 7, closingDate: daysAgo(8), signedDate: daysAgo(20) },
  });

  // Tasks
  await prisma.task.createMany({
    data: [
      { title: "Send executed contract to title company", priority: "urgent", status: "open", dueDate: daysFromNow(1), dealId: deals[0].id, leadId: leads[0].id, ownerId: acq.id },
      { title: "Follow up with Linda re: appointment", priority: "high", status: "open", dueDate: daysFromNow(0), leadId: leads[1].id, dealId: deals[2].id, ownerId: acq.id },
      { title: "Order comps for Tampa property", priority: "medium", status: "in_progress", dueDate: daysFromNow(2), dealId: deals[3].id, ownerId: acq.id },
      { title: "Blast 2207 Pinecrest to buyers list", priority: "high", status: "open", dueDate: daysFromNow(1), dealId: deals[6].id, ownerId: dispo.id },
      { title: "Verify proof of funds — Marcus Webb", priority: "medium", status: "open", dueDate: daysFromNow(3), ownerId: dispo.id },
      { title: "Skip trace new KC lead list", priority: "low", status: "open", dueDate: daysFromNow(4), ownerId: acq.id },
      { title: "Collect assignment fee — Elmwood deal", priority: "high", status: "done", completedAt: daysAgo(8), dealId: deals[5].id, ownerId: acq.id },
    ],
  });

  // Activities
  await prisma.activity.createMany({
    data: [
      { type: "call", body: "Spoke with Robert — motivated, inherited the property, wants quick close.", leadId: leads[0].id, dealId: deals[0].id, createdAt: daysAgo(6) },
      { type: "status_change", body: "Deal moved to Under Contract.", dealId: deals[0].id, createdAt: daysAgo(5) },
      { type: "sms", body: "Sent first-touch SMS to Linda.", leadId: leads[1].id, createdAt: daysAgo(4) },
      { type: "note", body: "James open to selling but wants to time it with his relocation in 60 days.", leadId: leads[2].id, createdAt: daysAgo(3) },
      { type: "offer", body: "Made cash offer of $72,000 on Hickory Ave.", leadId: leads[3].id, dealId: deals[1].id, createdAt: daysAgo(2) },
      { type: "email", body: "Blasted 2841 Maple Grove to VIP buyers — Amir replied within 20 min.", buyerId: buyers[0].id, createdAt: daysAgo(2) },
      { type: "note", body: "Verified proof of funds and added Nina to VIP tier.", buyerId: buyers[5].id, createdAt: daysAgo(10) },
    ],
  });

  console.log("Seed complete:");
  console.log(`  ${await prisma.user.count()} users`);
  console.log(`  ${await prisma.property.count()} properties`);
  console.log(`  ${await prisma.lead.count()} leads`);
  console.log(`  ${await prisma.buyer.count()} buyers`);
  console.log(`  ${await prisma.deal.count()} deals`);
  console.log(`  ${await prisma.campaign.count()} campaigns`);
  console.log(`  ${await prisma.contract.count()} contracts`);
  console.log(`  ${await prisma.task.count()} tasks`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
