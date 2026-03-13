import { useBannerStore } from "../store/bannerStore";
import beautyPromoImg from "../../../data/promotional/beauty.jpg";

/**
 * Creates a banner automatically for a campaign
 * @param {Object} campaign - The campaign object
 * @param {Object} bannerConfig - Optional banner configuration overrides
 * @returns {Object|null} - The created banner or null if auto-create is disabled
 */
export const createCampaignBanner = (campaign, bannerConfig = null) => {
  // Check if auto-create is enabled
  if (campaign.autoCreateBanner === false) {
    return null;
  }

  const bannerStore = useBannerStore.getState();

  // Get existing promotional banners to determine order
  const existingPromoBanners = bannerStore.getBannersByType("promotional");
  const nextOrder =
    existingPromoBanners.length > 0
      ? Math.max(...existingPromoBanners.map((b) => b.order || 0)) + 1
      : 1;

  // Generate banner data
  const bannerData = {
    type: "promotional",
    title: bannerConfig?.title || campaign.name,
    subtitle:
      bannerConfig?.subtitle ||
      (campaign.discountType === "percentage"
        ? `${campaign.discountValue}% OFF`
        : campaign.description || "Special Offer"),
    description: bannerConfig?.description || campaign.description || "",
    image: bannerConfig?.image || beautyPromoImg, // Default promotional image
    link: campaign.route || `/sale/${campaign.slug}`,
    order: nextOrder,
    isActive: campaign.isActive,
    startDate: campaign.startDate,
    endDate: campaign.endDate,
  };

  try {
    const banner = bannerStore.createBanner(bannerData);
    return banner;
  } catch (error) {
    console.error("Failed to create campaign banner:", error);
    return null;
  }
};
