import { CollectionGroup } from '../group';
import { Collection } from '../collection';
import { Query, buildQueryAndCursors, getFirestoreQuery } from '../query';
import { Observable, Subscriber } from 'rxjs';
import { Doc, doc } from '../doc';
import { wrapData } from '../data';
import { ref, pathToRef, Ref } from '../ref';

function toDoc<Model>(
  collection: Collection<Model> | CollectionGroup<Model>,
  snapshot: FirebaseFirestore.QueryDocumentSnapshot
): Doc<Model> {
  const modelRef: Ref<Model> = collection.__type__ === 'collectionGroup'
    ? pathToRef(snapshot.ref.path)
    : ref(collection, snapshot.id);
  return doc(modelRef, wrapData(snapshot.data()) as Model);
}

export function query$<Model>(
  collection: Collection<Model> | CollectionGroup<Model>,
  queries: Query<Model, keyof Model>[]
): Observable<Doc<Model>[]> {
  const { firestoreQuery, cursors } = buildQueryAndCursors(collection, queries);
  const query = getFirestoreQuery(firestoreQuery, cursors);

  return new Observable((subscriber: Subscriber<Doc<Model>[]>) => {
    const unsubcribe = query
      .onSnapshot((snapshot: FirebaseFirestore.QuerySnapshot) => {
        const docs: Doc<Model>[] = snapshot.docs
          .map((d) => toDoc<Model>(collection, d));

        return subscriber.next(docs);
      });
    return unsubcribe();
  });
}


