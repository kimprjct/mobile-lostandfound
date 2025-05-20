import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const createNotification = async (type, title, message, itemId = null, userId = null) => {
  try {
    const notificationData = {
      type,
      title,
      message,
      itemId,
      userId,
      status: 'unread',
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, 'admin_notifications'), notificationData);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

export const notificationTypes = {
  FOUND_ITEM_SUBMITTED: 'found_item_submitted',
  LOST_ITEM_REPORTED: 'lost_item_reported',
  CLAIM_REQUEST: 'claim_request',
  FOUND_REQUEST: 'found_request',
  CLAIM_APPROVED: 'claim_approved',
  CLAIM_REJECTED: 'claim_rejected',
  FOUND_APPROVED: 'found_approved',
  FOUND_REJECTED: 'found_rejected'
};