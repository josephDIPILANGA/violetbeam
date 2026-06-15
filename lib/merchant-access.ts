export type MerchantPublishingProfile = {
  wantsMarketplace: boolean;
  approvedForPosting: boolean;
  user: {
    emailVerified: Date | null;
  };
} | null;

export type MerchantPublishingState = {
  active: boolean;
  code:
    | "NO_MERCHANT_PROFILE"
    | "MARKETPLACE_DISABLED"
    | "EMAIL_NOT_VERIFIED"
    | "MERCHANT_NOT_APPROVED"
    | "ACTIVE";
  message: string;
};

export function getMerchantPublishingState(profile: MerchantPublishingProfile): MerchantPublishingState {
  if (!profile) {
    return {
      active: false,
      code: "NO_MERCHANT_PROFILE",
      message: "A VioletBeam merchant profile is required before adding Shopify products.",
    };
  }

  if (!profile.wantsMarketplace) {
    return {
      active: false,
      code: "MARKETPLACE_DISABLED",
      message: "Marketplace publishing is disabled for this merchant profile.",
    };
  }

  if (!profile.user.emailVerified) {
    return {
      active: false,
      code: "EMAIL_NOT_VERIFIED",
      message: "Verify your VioletBeam email before adding Shopify products.",
    };
  }

  if (!profile.approvedForPosting) {
    return {
      active: false,
      code: "MERCHANT_NOT_APPROVED",
      message: "This merchant profile is not approved for marketplace publishing yet.",
    };
  }

  return {
    active: true,
    code: "ACTIVE",
    message: "Merchant publishing is active.",
  };
}
