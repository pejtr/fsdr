import { notifyOwner } from "./_core/notification";
import * as db from "./db";

// Email notification types
export type NotificationType = 
  | "new_commission"
  | "new_badge"
  | "new_subscriber"
  | "subscription_renewed"
  | "payout_processed";

interface NotificationData {
  userId: number;
  type: NotificationType;
  data: Record<string, any>;
}

// Send notification to user (via owner notification system for now)
export async function sendUserNotification({ userId, type, data }: NotificationData): Promise<boolean> {
  const user = await db.getUserById(userId);
  if (!user) return false;

  let title = "";
  let content = "";

  switch (type) {
    case "new_commission":
      title = `💰 Nová provize: $${data.amount}`;
      content = `Gratulujeme! Získali jste novou affiliate provizi.

Detaily:
- Částka: $${data.amount}
- Úroveň: Tier ${data.tier}
- Sazba: ${data.commissionRate}%
- Od uživatele: ${data.referredUserName || 'Anonymní'}

Celkové výdělky: $${data.totalEarnings}

Děkujeme za vaši podporu FEMSIDER!`;
      break;

    case "new_badge":
      title = `🏆 Nový odznak: ${data.badgeName}`;
      content = `Gratulujeme! Odemkli jste nový odznak.

Odznak: ${data.badgeName}
Úroveň: ${data.tier}
Popis: ${data.description}

Pokračujte v budování své sítě a odemykejte další odznaky!`;
      break;

    case "new_subscriber":
      title = `🎉 Nový odběratel!`;
      content = `Máte nového odběratele!

Uživatel: ${data.subscriberName || 'Anonymní'}
Předplatné: $${data.amount}/měsíc

Váš výdělek: $${data.creatorEarnings} (88%)

Děkujeme, že jste součástí FEMSIDER!`;
      break;

    case "subscription_renewed":
      title = `🔄 Předplatné obnoveno`;
      content = `Odběratel obnovil své předplatné.

Uživatel: ${data.subscriberName || 'Anonymní'}
Částka: $${data.amount}
Váš výdělek: $${data.creatorEarnings}`;
      break;

    case "payout_processed":
      title = `💸 Výplata zpracována`;
      content = `Vaše výplata byla úspěšně zpracována.

Částka: $${data.amount}
Metoda: ${data.payoutMethod}
ID transakce: ${data.transactionId}

Prostředky by měly být na vašem účtu do 3-5 pracovních dnů.`;
      break;
  }

  // Log the notification (in production, this would send actual emails)
  console.log(`[Notification] Sending to user ${userId} (${user.email}):`, { title, content });

  // For now, we'll use the owner notification system
  // In production, integrate with email service like SendGrid, Mailgun, etc.
  try {
    // Store notification in database for user to see
    // For MVP, we just log it
    return true;
  } catch (error) {
    console.error("[Notification] Failed to send:", error);
    return false;
  }
}

// Send commission notification
export async function notifyNewCommission(
  affiliateId: number,
  amount: string,
  tier: number,
  commissionRate: string,
  referredUserId: number
): Promise<boolean> {
  const referredUser = await db.getUserById(referredUserId);
  const totalEarnings = await db.getAffiliateTotalEarnings(affiliateId);

  return sendUserNotification({
    userId: affiliateId,
    type: "new_commission",
    data: {
      amount,
      tier,
      commissionRate,
      referredUserName: referredUser?.name,
      totalEarnings,
    },
  });
}

// Send badge notification
export async function notifyNewBadge(
  userId: number,
  badgeName: string,
  tier: string,
  description: string
): Promise<boolean> {
  return sendUserNotification({
    userId,
    type: "new_badge",
    data: {
      badgeName,
      tier,
      description,
    },
  });
}

// Send new subscriber notification
export async function notifyNewSubscriber(
  creatorId: number,
  subscriberId: number,
  amount: string
): Promise<boolean> {
  const subscriber = await db.getUserById(subscriberId);
  const creatorEarnings = (parseFloat(amount) * 0.88).toFixed(2);

  return sendUserNotification({
    userId: creatorId,
    type: "new_subscriber",
    data: {
      subscriberName: subscriber?.name,
      amount,
      creatorEarnings,
    },
  });
}
