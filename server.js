const admin = require('firebase-admin');

// Initialize Firebase Admin using environment variables
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL
  }),
  databaseURL: 'https://zintebar-app-default-rtdb.asia-southeast1.firebasedatabase.app'
});

const db = admin.database();

console.log('[ZinteBar Push Server] Started — listening for pushQueue...');

// Listen to pushQueue — send FCM when new entry arrives
db.ref('pushQueue').on('child_added', async (snap) => {
  const job = snap.val();
  const jobKey = snap.key;

  if (!job || !job.targetPhone || !job.title || !job.body) {
    console.warn('[Push] Invalid job, skipping:', jobKey);
    await snap.ref.remove();
    return;
  }

  console.log(`[Push] New job: ${jobKey} → phone: ${job.targetPhone}`);

  try {
    const tokenSnap = await db.ref('fcmTokens/' + job.targetPhone).once('value');
    const tokenData = tokenSnap.val();

    if (!tokenData || !tokenData.token) {
      console.warn('[Push] No FCM token for phone:', job.targetPhone);
      await snap.ref.remove();
      return;
    }

    const fcmToken = tokenData.token;

    const message = {
      token: fcmToken,
      notification: {
        title: job.title,
        body: job.body
      },
      data: {
        title: job.title,
        body: job.body,
        page: job.page || 'home'
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'zintebar_orders'
        }
      }
    };

    const response = await admin.messaging().send(message);
    console.log(`[Push] ✅ Sent to ${job.targetPhone} — FCM ID: ${response}`);
    await snap.ref.remove();

  } catch (err) {
    console.error('[Push] ❌ Error:', err.message);
    await snap.ref.remove();
  }
});

// Listen for new orders — notify provider
db.ref('orders').on('child_added', async (snap) => {
  const order = snap.val();
  if (!order || !order.servicePhone || !order.status !== 'pending') return;

  const age = Date.now() - (order.createdAt || 0);
  if (age > 30000) return;

  console.log(`[Push] New order for provider: ${order.servicePhone}`);

  try {
    const tokenSnap = await db.ref('fcmTokens/' + order.servicePhone).once('value');
    const tokenData = tokenSnap.val();
    if (!tokenData || !tokenData.token) return;

    const customerName = order.customerName || 'Customer';
    const serviceName = order.serviceName || order.section || 'Service';

    const message = {
      token: tokenData.token,
      notification: {
        title: '📦 New Order Received!',
        body: `${customerName} ne "${serviceName}" order kiya. Tap karein dekhne ke liye.`
      },
      data: {
        title: '📦 New Order Received!',
        body: `${customerName} ne "${serviceName}" order kiya.`,
        page: 'provider-dashboard'
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'zintebar_orders'
        }
      }
    };

    const response = await admin.messaging().send(message);
    console.log(`[Push] ✅ Provider notified: ${order.servicePhone} — ${response}`);

  } catch (err) {
    console.error('[Push] ❌ Provider notify error:', err.message);
  }
});

// Keep process alive
process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught exception:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled rejection:', reason);
});

setInterval(() => {
  console.log('[ZinteBar Push Server] ♥ alive —', new Date().toISOString());
}, 5 * 60 * 1000);
    const fcmToken = tokenData.token;

    // Send FCM notification
    const message = {
      token: fcmToken,
      notification: {
        title: job.title,
        body: job.body
      },
      data: {
        title: job.title,
        body: job.body,
        page: job.page || 'home'
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'zintebar_orders'
        }
      }
    };

    const response = await admin.messaging().send(message);
    console.log(`[Push] ✅ Sent to ${job.targetPhone} — FCM ID: ${response}`);

    // Remove job from queue after success
    await snap.ref.remove();

  } catch (err) {
    console.error('[Push] ❌ Error:', err.message);
    // Remove job to avoid infinite retry loop
    await snap.ref.remove();
  }
});

// Also listen for new orders — notify provider
db.ref('orders').on('child_added', async (snap) => {
  const order = snap.val();
  if (!order || !order.servicePhone || !order.status !== 'pending') return;

  // Only process orders created in last 30 seconds
  const age = Date.now() - (order.createdAt || 0);
  if (age > 30000) return;

  console.log(`[Push] New order for provider: ${order.servicePhone}`);

  try {
    const tokenSnap = await db.ref('fcmTokens/' + order.servicePhone).once('value');
    const tokenData = tokenSnap.val();
    if (!tokenData || !tokenData.token) return;

    const customerName = order.customerName || 'Customer';
    const serviceName = order.serviceName || order.section || 'Service';

    const message = {
      token: tokenData.token,
      notification: {
        title: '📦 New Order Received!',
        body: `${customerName} ne "${serviceName}" order kiya. Tap karein dekhne ke liye.`
      },
      data: {
        title: '📦 New Order Received!',
        body: `${customerName} ne "${serviceName}" order kiya.`,
        page: 'provider-dashboard'
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'zintebar_orders'
        }
      }
    };

    const response = await admin.messaging().send(message);
    console.log(`[Push] ✅ Provider notified: ${order.servicePhone} — ${response}`);

  } catch (err) {
    console.error('[Push] ❌ Provider notify error:', err.message);
  }
});

// Keep process alive
process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught exception:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled rejection:', reason);
});

// Simple keep-alive log every 5 minutes
setInterval(() => {
  console.log('[ZinteBar Push Server] ♥ alive —', new Date().toISOString());
}, 5 * 60 * 1000);
