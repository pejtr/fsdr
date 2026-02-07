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


// ============ PUSH NOTIFICATIONS ============

// Store for Server-Sent Events connections
const sseConnections = new Map<number, Set<any>>();

/**
 * Register SSE connection for user
 */
export function registerSSEConnection(userId: number, res: any): void {
  if (!sseConnections.has(userId)) {
    sseConnections.set(userId, new Set());
  }
  sseConnections.get(userId)!.add(res);
  
  // Remove connection on close
  res.on('close', () => {
    sseConnections.get(userId)?.delete(res);
    if (sseConnections.get(userId)?.size === 0) {
      sseConnections.delete(userId);
    }
  });
}

/**
 * Send push notification to user via SSE
 */
export async function sendPushNotification(
  userId: number,
  notification: {
    type: string;
    title: string;
    content: string;
    linkUrl?: string;
    relatedUserId?: number;
  }
): Promise<boolean> {
  try {
    // Store notification in database
    await db.createNotification({
      userId,
      type: notification.type as any,
      title: notification.title,
      content: notification.content,
      linkUrl: notification.linkUrl,
      relatedUserId: notification.relatedUserId,
    });
    
    // Send to all active SSE connections for this user
    const connections = sseConnections.get(userId);
    if (connections && connections.size > 0) {
      const eventData = JSON.stringify({
        type: 'notification',
        data: notification,
        timestamp: Date.now(),
      });
      
      connections.forEach((res) => {
        try {
          res.write(`data: ${eventData}\n\n`);
        } catch (e) {
          // Connection might be closed
        }
      });
    }
    
    return true;
  } catch (error) {
    console.error('[Push Notification] Failed:', error);
    return false;
  }
}

/**
 * Notify user about new message
 */
export async function notifyNewMessage(
  recipientId: number,
  senderId: number,
  messagePreview: string
): Promise<boolean> {
  const sender = await db.getUserById(senderId);
  
  return sendPushNotification(recipientId, {
    type: 'new_message',
    title: `💬 Nová zpráva od ${sender?.name || 'Uživatel'}`,
    content: messagePreview.length > 100 ? messagePreview.slice(0, 100) + '...' : messagePreview,
    linkUrl: `/messages?user=${senderId}`,
    relatedUserId: senderId,
  });
}

/**
 * Notify creator about new comment
 */
export async function notifyNewComment(
  creatorId: number,
  commenterId: number,
  contentTitle: string,
  commentPreview: string,
  contentType: 'video' | 'post',
  contentId: number
): Promise<boolean> {
  const commenter = await db.getUserById(commenterId);
  
  return sendPushNotification(creatorId, {
    type: 'new_comment',
    title: `💬 Nový komentář na ${contentType === 'video' ? 'video' : 'příspěvek'}`,
    content: `${commenter?.name || 'Uživatel'} komentoval "${contentTitle}": ${commentPreview.slice(0, 80)}...`,
    linkUrl: contentType === 'video' ? `/video/${contentId}` : `/feed?post=${contentId}`,
    relatedUserId: commenterId,
  });
}

/**
 * Notify user about new like
 */
export async function notifyNewLike(
  creatorId: number,
  likerId: number,
  contentTitle: string,
  contentType: 'video' | 'post',
  contentId: number
): Promise<boolean> {
  const liker = await db.getUserById(likerId);
  
  return sendPushNotification(creatorId, {
    type: 'new_like',
    title: `❤️ Nový like!`,
    content: `${liker?.name || 'Uživatel'} dal like na "${contentTitle}"`,
    linkUrl: contentType === 'video' ? `/video/${contentId}` : `/feed?post=${contentId}`,
    relatedUserId: likerId,
  });
}

/**
 * Notify user about new follower
 */
export async function notifyNewFollower(
  creatorId: number,
  followerId: number
): Promise<boolean> {
  const follower = await db.getUserById(followerId);
  
  return sendPushNotification(creatorId, {
    type: 'new_follower',
    title: `👤 Nový sledující!`,
    content: `${follower?.name || 'Uživatel'} vás začal sledovat`,
    linkUrl: `/profile/${followerId}`,
    relatedUserId: followerId,
  });
}

/**
 * Send welcome notification to new user
 */
export async function sendWelcomeNotification(
  userId: number,
  userName: string
): Promise<boolean> {
  return sendPushNotification(userId, {
    type: 'welcome',
    title: `🎉 Vítej na FEMSIDER, ${userName}!`,
    content: `Děkujeme za registraci! Tady je tvůj průvodce platformou:\n\n📸 Prohlížej galerii - Objevuj fotky a videa od naší komunity\n💬 Fórum - Zapoj se do diskuzí a poznej nové lidi\n🏆 Gamifikace - Sbírej body, odznaky a stávej se legendou\n💰 Affiliate - Pozvi kamarády a vydělávej provize\n\n🎁 Speciální nabídka: Vyzkoušej Komunita+ se slevou 50%! Odemkni exkluzivní obsah, 4K videa a přímý kontakt s tvůrci.\n\nUžij si to! 🚀`,
    linkUrl: '/#pricing',
  });
}

/**
 * Get unread notification count for user
 */
export async function getUnreadNotificationCount(userId: number): Promise<number> {
  return db.getUnreadNotificationCount(userId);
}
