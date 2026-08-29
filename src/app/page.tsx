import { InvitationExperience } from "@/components/invitation/invitation-experience";
import { getPublicWishes, getSiteSettings } from "@/lib/data";

export default async function Home() {
  const [settings, wishPage] = await Promise.all([
    getSiteSettings(),
    getPublicWishes(0, 5),
  ]);

  return (
    <InvitationExperience
      settings={settings}
      invitee={null}
      initialWishes={wishPage.wishes}
      initialWishCount={wishPage.count}
      hasSubmittedWish={false}
      isPrivate={false}
    />
  );
}
