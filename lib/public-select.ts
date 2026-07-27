export const publicSellerSelect = {
  id: true,
  sellerReferenceId: true,
  fullName: true,
  businessName: true,
  city: true,
  region: true,
  category: true,
  productsOrServices: true,
  businessStage: true,
  shortSummary: true,
  journeyStory: true,
  achievements: true,
  communityImpact: true,
  futureGoals: true,
  supportNeeded: true,
  useOfFunds: true,
  isFeatured: true,
  media: {
    where: { isPublic: true },
    orderBy: [{ mediaType: "asc" as const }, { sortOrder: "asc" as const }],
    select: {
      id: true,
      mediaType: true,
      fileUrl: true,
      thumbnailUrl: true,
      originalFileName: true
    }
  }
};
