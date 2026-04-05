const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();

const db = getFirestore();
const messaging = getMessaging();

// ← CHANGE THIS TO YOUR EMAIL
const ADMIN_EMAILS = ['YOUR_EMAIL@gmail.com'];

// 1. Daily Balance Multiplier + Growth Log
exports.doubleUserBalances = onSchedule("every day 00:00", async (event) => {
  console.log("🚀 Running daily balance multiplier...");

  const usersSnapshot = await db.collection('users').get();
  const batch = db.batch();
  let updatedCount = 0;

  for (const docSnap of usersSnapshot.docs) {
    const data = docSnap.data();
    const userEmail = data.email || docSnap.id;
    const userId = docSnap.id;

    if (ADMIN_EMAILS.includes(userEmail)) {
      console.log(`⏭️ Skipping admin: ${userEmail}`);
      continue;
    }

    if (data.balance && data.balance > 0) {
      const oldBalance = data.balance;
      const newBalance = oldBalance * 2;

      // Update balance
      batch.update(docSnap.ref, { balance: newBalance });

      // Log growth event
      const growthLogRef = db.collection('growth_logs').doc();
      batch.set(growthLogRef, {
        userId: userId,
        userEmail: userEmail,
        oldBalance: oldBalance,
        newBalance: newBalance,
        growthPercent: 100,
        currency: data.preferredCurrency || 'USD',
        timestamp: Timestamp.now(),
        type: 'daily_multiplier'
      });

      updatedCount++;
    }
  }

  await batch.commit();
  console.log(`✅ Doubled balances and logged growth for ${updatedCount} users`);
});

// 2. Notify YOU (admin) instantly when ANY user makes a deposit
exports.notifyAdminOnDeposit = onDocumentCreated("deposits/{docId}", async (event) => {
  const deposit = event.data.data();
  if (!deposit || deposit.status !== 'success') return;

  // Get your saved FCM token
  const adminDoc = await db.collection('admin').doc('notifications').get();
  const adminToken = adminDoc.exists ? adminDoc.data().fcmToken : null;

  if (!adminToken) {
    console.log("⚠️ No admin FCM token found");
    return;
  }

  const amountStr = `${deposit.amount.toLocaleString()} ${deposit.currency || 'USD'}`;
  const message = {
    token: adminToken,
    notification: {
      title: "💰 New Deposit Received!",
      body: `${deposit.userEmail} deposited ${amountStr} via ${deposit.type.toUpperCase()}`
    },
    data: {
      depositId: event.params.docId,
      userEmail: deposit.userEmail,
      amount: amountStr,
      timestamp: new Date().toISOString()
    },
    android: { priority: "high" },
    apns: { headers: { "apns-priority": "10" } }
  };

  try {
    await messaging.send(message);
    console.log("✅ Admin push notification sent!");
  } catch (error) {
    console.error("❌ Error sending admin notification:", error);
  }
});