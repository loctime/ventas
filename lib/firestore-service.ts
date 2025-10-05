import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  Timestamp,
  DocumentData,
  QuerySnapshot
} from 'firebase/firestore'
import { db } from './firebase'

export interface Transaction {
  id?: string
  type: 'collection' | 'payment'
  amount: number
  description: string
  category: string
  date: Date
  createdAt?: Date
  updatedAt?: Date
}

export interface PaymentMethod {
  id?: string
  name: string
  type: 'cash' | 'card' | 'transfer' | 'other'
  isDefault: boolean
  createdAt?: Date
  updatedAt?: Date
}

export class FirestoreService {
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  // Collections (Ingresos)
  async addCollection(transaction: Omit<Transaction, 'id' | 'type'>) {
    const collectionData = {
      ...transaction,
      type: 'collection' as const,
      userId: this.userId,
      date: Timestamp.fromDate(transaction.date),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }
    
    const docRef = await addDoc(collection(db, 'transactions'), collectionData)
    return docRef.id
  }

  async updateCollection(id: string, transaction: Partial<Omit<Transaction, 'id' | 'type'>>) {
    const updateData = {
      ...transaction,
      updatedAt: Timestamp.now(),
      ...(transaction.date && { date: Timestamp.fromDate(transaction.date) })
    }
    
    await updateDoc(doc(db, 'transactions', id), updateData)
  }

  async deleteCollection(id: string) {
    await deleteDoc(doc(db, 'transactions', id))
  }

  // Payments (Gastos)
  async addPayment(transaction: Omit<Transaction, 'id' | 'type'>) {
    const paymentData = {
      ...transaction,
      type: 'payment' as const,
      userId: this.userId,
      date: Timestamp.fromDate(transaction.date),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }
    
    const docRef = await addDoc(collection(db, 'transactions'), paymentData)
    return docRef.id
  }

  async updatePayment(id: string, transaction: Partial<Omit<Transaction, 'id' | 'type'>>) {
    const updateData = {
      ...transaction,
      updatedAt: Timestamp.now(),
      ...(transaction.date && { date: Timestamp.fromDate(transaction.date) })
    }
    
    await updateDoc(doc(db, 'transactions', id), updateData)
  }

  async deletePayment(id: string) {
    await deleteDoc(doc(db, 'transactions', id))
  }

  // Payment Methods
  async addPaymentMethod(paymentMethod: Omit<PaymentMethod, 'id'>) {
    const paymentMethodData = {
      ...paymentMethod,
      userId: this.userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }
    
    const docRef = await addDoc(collection(db, 'paymentMethods'), paymentMethodData)
    return docRef.id
  }

  async updatePaymentMethod(id: string, paymentMethod: Partial<Omit<PaymentMethod, 'id'>>) {
    const updateData = {
      ...paymentMethod,
      updatedAt: Timestamp.now()
    }
    
    await updateDoc(doc(db, 'paymentMethods', id), updateData)
  }

  async deletePaymentMethod(id: string) {
    await deleteDoc(doc(db, 'paymentMethods', id))
  }

  // Real-time listeners
  subscribeToCollections(callback: (collections: Transaction[]) => void) {
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', this.userId),
      where('type', '==', 'collection'),
      orderBy('date', 'desc')
    )

    return onSnapshot(q, (snapshot) => {
      const collections = this.convertSnapshotToTransactions(snapshot)
      callback(collections)
    })
  }

  subscribeToPayments(callback: (payments: Transaction[]) => void) {
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', this.userId),
      where('type', '==', 'payment'),
      orderBy('date', 'desc')
    )

    return onSnapshot(q, (snapshot) => {
      const payments = this.convertSnapshotToTransactions(snapshot)
      callback(payments)
    })
  }

  subscribeToPaymentMethods(callback: (paymentMethods: PaymentMethod[]) => void) {
    const q = query(
      collection(db, 'paymentMethods'),
      where('userId', '==', this.userId),
      orderBy('createdAt', 'asc')
    )

    return onSnapshot(q, (snapshot) => {
      const paymentMethods = this.convertSnapshotToPaymentMethods(snapshot)
      callback(paymentMethods)
    })
  }

  // Helper methods
  private convertSnapshotToTransactions(snapshot: QuerySnapshot<DocumentData>): Transaction[] {
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate() || new Date(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Transaction[]
  }

  private convertSnapshotToPaymentMethods(snapshot: QuerySnapshot<DocumentData>): PaymentMethod[] {
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as PaymentMethod[]
  }

  // Get all transactions (for history)
  async getAllTransactions(): Promise<Transaction[]> {
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', this.userId),
      orderBy('date', 'desc')
    )

    const snapshot = await getDocs(q)
    return this.convertSnapshotToTransactions(snapshot)
  }

  // Get payment methods
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const q = query(
      collection(db, 'paymentMethods'),
      where('userId', '==', this.userId),
      orderBy('createdAt', 'asc')
    )

    const snapshot = await getDocs(q)
    return this.convertSnapshotToPaymentMethods(snapshot)
  }
}
