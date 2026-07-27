import bcrypt from "bcryptjs";
import { PrismaClient, ApplicationStatus, EnquiryStatus, MediaType, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminPasswordHash = await bcrypt.hash("AdminPass123!", 12);
  const sellerPasswordHash = await bcrypt.hash("SellerPass123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@fusbus.test" },
    update: {
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      emailVerified: true,
      isActive: true,
      failedLogins: 0,
      lockedUntil: null
    },
    create: {
      email: "admin@fusbus.test",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      emailVerified: true
    }
  });

  const sellers = [
    {
      email: "draft@fusbus.test",
      fullName: "Amina Bello",
      businessName: "Garoua Shea Studio",
      status: ApplicationStatus.DRAFT,
      city: "Garoua",
      region: "North",
      category: "Beauty and Wellness",
      products: "Shea butter skincare, soaps, and natural body products prepared for retail partners.",
      summary: "A Northern Cameroon wellness brand turning local shea supply chains into packaged skincare products.",
      story: "Amina began selling handmade soaps through family networks before learning packaging, formulation, and social selling. She wants stronger branding, safer production equipment, and distribution partners who understand natural wellness products.",
      support: "Brand development, packaging support, retail buyer introductions"
    },
    {
      email: "submitted@fusbus.test",
      fullName: "Fru Neba",
      businessName: "Bamenda Loom Collective",
      status: ApplicationStatus.SUBMITTED,
      city: "Bamenda",
      region: "Northwest",
      category: "Fashion and Textiles",
      products: "Contemporary clothing, woven accessories, uniforms, and made-to-order textile pieces.",
      summary: "A textile collective combining regional craft, modern tailoring, and digital customer orders.",
      story: "Fru started with one sewing machine and now coordinates tailors and weavers across Bamenda. The business has served local schools, churches, and diaspora customers, but needs better equipment and export-ready production systems.",
      support: "Equipment finance, export mentorship, buyer introductions"
    },
    {
      email: "approved@fusbus.test",
      fullName: "Yvette Mballa",
      businessName: "Douala Digital Trade Services",
      status: ApplicationStatus.APPROVED,
      city: "Douala",
      region: "Littoral",
      category: "Digital Services",
      products: "Product photography, online storefront setup, catalogue management, and customer support for small sellers.",
      summary: "A service business helping local entrepreneurs sell online with stronger visuals and customer operations.",
      story: "Yvette started by helping neighbors photograph products with a mobile phone and list them online. The work grew into a small digital trade service supporting food brands, fashion sellers, and artisans. International exposure would help her train more young people, buy better equipment, and support more sellers who are ready to be seen beyond Cameroon.",
      support: "Mentorship, equipment sponsorship, partner introductions"
    },
    {
      email: "approved-fashion@fusbus.test",
      fullName: "Nadia Epassi",
      businessName: "Yaounde Heritage Atelier",
      status: ApplicationStatus.APPROVED,
      city: "Yaounde",
      region: "Centre",
      category: "Creative Goods",
      products: "Handmade accessories, home decor, beadwork, and contemporary pieces inspired by Cameroonian heritage.",
      summary: "A creative studio producing refined handmade goods for gift, decor, and boutique retail markets.",
      story: "Nadia built her atelier through weekend markets, social media orders, and collaborations with young makers from different communities. She wants to standardize quality, document each maker's story, and reach boutique buyers who value ethical craft.",
      support: "Sponsorship, boutique buyer introductions, storytelling support"
    },
    {
      email: "approved-manufacturing@fusbus.test",
      fullName: "Samuel Tchoua",
      businessName: "Bafoussam Light Manufacturing",
      status: ApplicationStatus.APPROVED,
      city: "Bafoussam",
      region: "West",
      category: "Manufacturing",
      products: "Small household fittings, repair parts, metal prototypes, and custom fabrication services.",
      summary: "A small manufacturing workshop creating practical parts and repair solutions for local businesses.",
      story: "Samuel began as an apprentice repairing equipment for traders and farms. His workshop now produces small parts and prototypes, but better machinery and technical partnerships would help him serve more businesses and create skilled jobs.",
      support: "Equipment finance, technical partnership, manufacturing mentorship"
    },
    {
      email: "rejected@fusbus.test",
      fullName: "Mireille Etame",
      businessName: "Limbe Coastal Foods",
      status: ApplicationStatus.REJECTED,
      city: "Limbe",
      region: "Southwest",
      category: "Food Processing",
      products: "Packaged spices, snacks, and preserved food products for local retail.",
      summary: "A food processing seller working toward better packaging and compliance documentation.",
      story: "Mireille began with family recipes and local shop orders. The business needs stronger documentation before publication in this seed scenario.",
      support: "Compliance support, packaging advice, food retail mentorship"
    }
  ] as const;

  for (const sellerSeed of sellers) {
    const user = await prisma.user.upsert({
      where: { email: sellerSeed.email },
      update: {
        passwordHash: sellerPasswordHash,
        role: UserRole.SELLER,
        emailVerified: true,
        isActive: true,
        failedLogins: 0,
        lockedUntil: null
      },
      create: {
        email: sellerSeed.email,
        passwordHash: sellerPasswordHash,
        role: UserRole.SELLER,
        emailVerified: true
      }
    });

    const profile = await prisma.sellerProfile.upsert({
      where: { userId: user.id },
      update: {
        fullName: sellerSeed.fullName,
        businessName: sellerSeed.businessName,
        city: sellerSeed.city,
        region: sellerSeed.region,
        category: sellerSeed.category,
        productsOrServices: sellerSeed.products,
        shortSummary: sellerSeed.summary,
        journeyStory: sellerSeed.story,
        supportNeeded: sellerSeed.support,
        applicationStatus: sellerSeed.status,
        consentPublish: sellerSeed.status === ApplicationStatus.APPROVED,
        isFeatured: sellerSeed.status === ApplicationStatus.APPROVED
      },
      create: {
        userId: user.id,
        fullName: sellerSeed.fullName,
        businessName: sellerSeed.businessName,
        sellerReferenceId: sellerSeed.status === ApplicationStatus.APPROVED ? `CMR-2026-${String(sellers.indexOf(sellerSeed) + 1).padStart(4, "0")}` : null,
        city: sellerSeed.city,
        region: sellerSeed.region,
        category: sellerSeed.category,
        productsOrServices: sellerSeed.products,
        businessStage: "Growing",
        yearsInBusiness: 4,
        employeeCount: 8,
        shortSummary: sellerSeed.summary,
        journeyStory: sellerSeed.story,
        challenges: "Access to equipment, packaging finance, and trusted international distribution.",
        achievements: "Consistent local sales, repeat customers, and community employment.",
        communityImpact: "Creates income for families and buys raw materials from nearby suppliers.",
        futureGoals: "Expand production, improve packaging, and enter reliable export partnerships.",
        supportNeeded: sellerSeed.support,
        fundingAmount: "15000",
        useOfFunds: "Equipment, packaging, quality certification, and working capital.",
        websiteUrl: "https://example.com",
        consentReview: true,
        consentPublish: sellerSeed.status === ApplicationStatus.APPROVED,
        applicationStatus: sellerSeed.status,
        isFeatured: sellerSeed.status === ApplicationStatus.APPROVED,
        submittedAt: sellerSeed.status === ApplicationStatus.DRAFT ? null : new Date(),
        approvedAt: sellerSeed.status === ApplicationStatus.APPROVED ? new Date() : null,
        approvedBy: sellerSeed.status === ApplicationStatus.APPROVED ? admin.id : null,
        rejectionReason: sellerSeed.status === ApplicationStatus.REJECTED ? "Insufficient verification details in development seed." : null
      }
    });

    if (sellerSeed.status === ApplicationStatus.APPROVED) {
      await prisma.sellerMedia.upsert({
        where: { id: `${profile.id}-profile` },
        update: {
          originalFileName: "douala-digital-trade-services.png",
          storedFileName: "douala-digital-trade-services.png",
          fileUrl: "/sellers/douala-digital-trade-services.png",
          thumbnailUrl: "/sellers/douala-digital-trade-services-thumb.png",
          mimeType: "image/png",
          fileSize: 2400000,
          isPublic: true
        },
        create: {
          id: `${profile.id}-profile`,
          sellerProfileId: profile.id,
          mediaType: MediaType.PROFILE,
          originalFileName: "douala-digital-trade-services.png",
          storedFileName: "douala-digital-trade-services.png",
          fileUrl: "/sellers/douala-digital-trade-services.png",
          thumbnailUrl: "/sellers/douala-digital-trade-services-thumb.png",
          mimeType: "image/png",
          fileSize: 2400000,
          isPublic: true
        }
      });
    }
  }

  const approved = await prisma.sellerProfile.findFirstOrThrow({ where: { applicationStatus: ApplicationStatus.APPROVED } });
  const sampleInvestor = await prisma.investor.upsert({
    where: {
      email_organisationName: {
        email: "partner@example.com",
        organisationName: "Impact Trade Fund"
      }
    },
    update: {
      fullName: "Jane Partner",
      phoneNumber: "+44 7000 000000",
      country: "United Kingdom",
      interestType: "Investor",
      status: "ACTIVE"
    },
    create: {
      fullName: "Jane Partner",
      organisationName: "Impact Trade Fund",
      email: "partner@example.com",
      phoneNumber: "+44 7000 000000",
      country: "United Kingdom",
      interestType: "Investor",
      status: "ACTIVE"
    }
  });
  await prisma.investorEnquiry.create({
    data: {
      investorId: sampleInvestor.id,
      sellerProfileId: approved.id,
      sellerReferenceId: approved.sellerReferenceId!,
      fullName: "Jane Partner",
      organisationName: "Impact Trade Fund",
      email: "partner@example.com",
      country: "United Kingdom",
      interestType: "Investor",
      estimatedSupport: "25000",
      message: "We would like to understand production capacity and export readiness.",
      preferredContactMethod: "Email",
      consent: true,
      status: EnquiryStatus.NEW
    }
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
