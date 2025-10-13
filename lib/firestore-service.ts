import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  setDoc,
  query, 
  where, 
  orderBy,
  onSnapshot,
  Timestamp,
  DocumentData,
  QuerySnapshot
} from 'firebase/firestore'
import { db } from './firebase'
import type { DailyClosure, DailyExpense, UserSettings } from './types'

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

  // ==================== DAILY CLOSURES ====================

  // Obtener transacciones de un día específico
  async getTransactionsForDate(dateStr: string): Promise<Transaction[]> {
    const startOfDay = new Date(dateStr)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(dateStr)
    endOfDay.setHours(23, 59, 59, 999)

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', this.userId),
      where('date', '>=', Timestamp.fromDate(startOfDay)),
      where('date', '<=', Timestamp.fromDate(endOfDay))
    )

    const snapshot = await getDocs(q)
    return this.convertSnapshotToTransactions(snapshot)
  }

  // Crear o actualizar cierre diario
  async saveDailyClosure(closure: Omit<DailyClosure, 'userId'>): Promise<void> {
    const closureData = {
      ...closure,
      userId: this.userId,
      createdAt: closure.createdAt || Date.now(),
      updatedAt: Date.now()
    }

    // Remover campos undefined (Firestore no los acepta)
    const cleanedData = Object.fromEntries(
      Object.entries(closureData).filter(([_, value]) => value !== undefined)
    )

    // Usar la fecha como ID del documento para evitar duplicados
    const docRef = doc(db, 'dailyClosures', `${this.userId}_${closure.date}`)
    await setDoc(docRef, cleanedData)
  }

  // Obtener cierre de un día específico
  async getDailyClosure(dateStr: string): Promise<DailyClosure | null> {
    const docRef = doc(db, 'dailyClosures', `${this.userId}_${dateStr}`)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return null
    }

    return {
      id: docSnap.id,
      ...docSnap.data()
    } as DailyClosure
  }

  // Obtener todos los cierres (para historial)
  async getAllDailyClosures(): Promise<DailyClosure[]> {
    const q = query(
      collection(db, 'dailyClosures'),
      where('userId', '==', this.userId),
      orderBy('date', 'desc')
    )

    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as DailyClosure[]
  }

  // Suscribirse a cambios en cierres diarios
  subscribeToDailyClosures(callback: (closures: DailyClosure[]) => void) {
    const q = query(
      collection(db, 'dailyClosures'),
      where('userId', '==', this.userId),
      orderBy('date', 'desc')
    )

    return onSnapshot(q, (snapshot) => {
      const closures = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DailyClosure[]
      callback(closures)
    })
  }

  // Suscribirse al cierre de hoy
  subscribeToDailyClosure(dateStr: string, callback: (closure: DailyClosure | null) => void) {
    const docRef = doc(db, 'dailyClosures', `${this.userId}_${dateStr}`)
    
    return onSnapshot(docRef, (doc) => {
      if (!doc.exists()) {
        callback(null)
        return
      }
      
      callback({
        id: doc.id,
        ...doc.data()
      } as DailyClosure)
    })
  }

  // Cerrar el día (marcar como cerrado)
  async closeDailyBalance(dateStr: string): Promise<void> {
    const docRef = doc(db, 'dailyClosures', `${this.userId}_${dateStr}`)
    await updateDoc(docRef, {
      status: 'closed',
      closedAt: Date.now(),
      updatedAt: Date.now()
    })
  }

  // ==================== USER SETTINGS ====================

  async getUserSettings(): Promise<UserSettings | null> {
    const docRef = doc(db, 'userSettings', this.userId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return null
    }

    return docSnap.data() as UserSettings
  }

  async saveUserSettings(settings: Partial<UserSettings>): Promise<void> {
    const docRef = doc(db, 'userSettings', this.userId)
    const settingsData = {
      ...settings,
      userId: this.userId,
      updatedAt: Date.now()
    }

    await setDoc(docRef, settingsData, { merge: true })
  }

  subscribeToUserSettings(callback: (settings: UserSettings | null) => void) {
    const docRef = doc(db, 'userSettings', this.userId)
    
    return onSnapshot(docRef, (doc) => {
      if (!doc.exists()) {
        callback(null)
        return
      }
      
      callback(doc.data() as UserSettings)
    })
  }
}
