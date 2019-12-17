import { Collection } from '../collection';
import { Observable, Subscriber } from 'rxjs';
import { ref } from '../ref';
import firestore from '../adaptor';
import { DocChange, docChange } from '../docChange';

export function snapshotChanges$<Model>(
  collection: Collection<Model>
): Observable<DocChange<Model>[]> {
  return new Observable((subscriber: Subscriber<DocChange<Model>[]>) => {
    const unsubscribe = firestore().collection(collection.path)
      .onSnapshot((snapshot: FirebaseFirestore.QuerySnapshot) => {
        const docs: DocChange<Model>[] = snapshot
          .docChanges()
          .map((doc: FirebaseFirestore.DocumentChange) =>
            docChange<Model>(ref(collection, doc.doc.id), doc)
          );

        subscriber.next(docs);
      });

    return () => {
      unsubscribe();
    };
  });
}
