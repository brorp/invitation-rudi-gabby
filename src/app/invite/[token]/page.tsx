import { notFound } from "next/navigation";

import { InvitationExperience } from "@/components/invitation/invitation-experience";
import {
  findInviteeByToken,
  getPublicWishes,
  getSiteSettings,
  hasInviteeSubmittedWish,
} from "@/lib/data";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function PersonalInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invitee = await findInviteeByToken(token);

  if (!invitee) notFound();

  const [settings, wishPage, hasSubmittedWish] = await Promise.all([
    getSiteSettings(),
    getPublicWishes(0, 5),
    hasInviteeSubmittedWish(invitee.id),
  ]);

  return (
    <InvitationExperience
      settings={settings}
      invitee={invitee}
      initialWishes={wishPage.wishes}
      initialWishCount={wishPage.count}
      hasSubmittedWish={hasSubmittedWish}
      isPrivate
    />
  );
}
