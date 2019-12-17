import { Collection } from '../collection';
import { CollectionGroup } from '../group';
import { Query } from '../query';
import { Observable, Subscriber } from 'rxjs';
import { DocChange, docChange } from '../docChange';
import { buildQueryAndCursors, getFirestoreQuery } from '../query';
import { pathToRef, ref, Ref } from '../ref';

function toDocChange<Model>(
  collection: Collection<Model> | CollectionGroup<Model>,
  change: FirebaseFirestore.DocumentChange
): DocChange<Model> {
  const modelRef: Ref<Model> = collection.__type__ === 'collectionGroup'
    ? pathToRef(change.doc.ref.path)
    : ref(collection, change.doc.id);
  return docChange(modelRef, change);
}

export function querySnapshotChanges$<Model>(
  collection: Collection<Model> | CollectionGroup<Model>,
  queries: Query<Model, keyof Model>[]
): Observable<DocChange<Model>[]> {
  const { firestoreQuery, cursors } = buildQueryAndCursors(collection, queries);
  const query = getFirestoreQuery(firestoreQuery, cursors);

  return new Observable((subscriber: Subscriber<DocChange<Model>[]>) => {
    const unsubscribe = query.onSnapshot((snapshot: FirebaseFirestore.QuerySnapshot) => {
      const docs: DocChange<Model>[] = snapshot
        .docChanges()
        .map((change: FirebaseFirestore.DocumentChange) =>
          toDocChange(collection, change)
        );

      subscriber.next(docs);
    });

    return () => {
      unsubscribe();
    };
  });
}
