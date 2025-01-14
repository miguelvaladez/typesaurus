/**
 * Node.js Firestore adaptor.
 */

import * as firestore from '@google-cloud/firestore'
import * as admin from 'firebase-admin'

export default function store() {
  return admin.firestore()
}

export type FirestoreQuery = admin.firestore.Query
export type FirestoreDocumentReference = admin.firestore.DocumentReference
export const FirestoreDocumentReference = admin.firestore.DocumentReference
export type FirestoreDocumentData = admin.firestore.DocumentData
export type FirestoreTimestamp = admin.firestore.Timestamp
export const FirestoreTimestamp = admin.firestore.Timestamp
export const FirestoreFieldValue = admin.firestore.FieldValue
export type FirebaseWriteBatch = admin.firestore.WriteBatch
export type FirestoreCollectionReference = admin.firestore.CollectionReference
export type FirestoreTransaction = admin.firestore.Transaction
// TODO: Use admin reference after they added to firebase-admin
export type FirestoreOrderByDirection = firestore.OrderByDirection
export type FirestoreWhereFilterOp = firestore.WhereFilterOp
