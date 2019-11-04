import firestore from '../adaptor';
import { Collection, isCollection } from '../collection';
import { Doc, doc } from '../doc';
import { Ref, ref } from '../ref';
import { wrapData } from '../data';
import { Observable } from 'rxjs';

function get$<Model>(ref: Ref<Model>): Observable<Doc<Model> | undefined>

function get$<Model>(
  collection: Collection<Model>,
  id: string
): Observable<Doc<Model> | undefined>

function get$<Model>(
  collectionOrRef: Collection<Model> | Ref<Model>,
  maybeId?: string
): Observable<Doc<Model> | undefined> {
  let id: string;
  let collection: Collection<Model>;

  if (isCollection(collectionOrRef)) {
    if (!maybeId) {
      throw new Error('Missing ID from get request');
    }
    id = maybeId;
    collection = collectionOrRef;
  } else {
    id = collectionOrRef.id;
    collection = collectionOrRef.collection;
  }

  const firestoreDoc = firestore()
    .collection(collection.path)
    .doc(id);

  return new Observable((observer) => {
    firestoreDoc.onSnapshot((snapshot: FirebaseFirestore.DocumentSnapshot) => {
      const firestoreData = snapshot.data();
      const data: Model | undefined = firestoreData && (wrapData(firestoreData) as Model);
      if (!data) {
        return observer.next(undefined);
      }
      return observer.next(doc(ref(collection, id), data));
    })
  });
}

export default get$