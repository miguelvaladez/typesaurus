import { Collection } from '../collection'
import firestore from '../adaptor'
import { doc, Doc } from '../doc'
import { ref } from '../ref'
import { wrapData } from '../data'
import { Observable } from 'rxjs';

export default function all$<Model>(
  collection: Collection<Model>
): Observable<Doc<Model>[]> {
  return new Observable((observer) => {
    firestore().collection(collection.path)
      .onSnapshot((snapshot: FirebaseFirestore.QuerySnapshot) => {
        const docs: Doc<Model>[] = snapshot.docs.map(d =>
          doc(ref(collection, d.id), wrapData(d.data()) as Model)
        );
        observer.next(docs);
      });
  });
}
