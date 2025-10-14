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

    // Generar ID basado en fecha y número de cierre
    const closureId = closure.closureNumber 
      ? `${this.userId}_${closure.date}_${closure.closureNumber}`
      : `${this.userId}_${closure.date}`

    const docRef = doc(db, 'dailyClosures', closureId)
    await setDoc(docRef, cleanedData)
  }

  // Obtener cierre de un día específico (el más reciente si hay múltiples)
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

  // Obtener todos los cierres de un día específico
  async getDailyClosuresForDate(dateStr: string): Promise<DailyClosure[]> {
    const q = query(
      collection(db, 'dailyClosures'),
      where('userId', '==', this.userId),
      where('date', '==', dateStr),
      orderBy('createdAt', 'desc')
    )

    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as DailyClosure[]
  }

  // Obtener el siguiente número de cierre para un día
  async getNextClosureNumber(dateStr: string): Promise<number> {
    const closures = await this.getDailyClosuresForDate(dateStr)
    const maxNumber = closures.reduce((max, closure) => {
      return Math.max(max, closure.closureNumber || 1)
    }, 0)
    return maxNumber + 1
  }

  // Eliminar cierre de un día específico
  async deleteDailyClosure(dateStr: string): Promise<void> {
    const docRef = doc(db, 'dailyClosures', `${this.userId}_${dateStr}`)
    await deleteDoc(docRef)
  }

  // Eliminar cierre específico por ID
  async deleteClosureById(closureId: string): Promise<void> {
    const docRef = doc(db, 'dailyClosures', closureId)
    await deleteDoc(docRef)
  }

  // Eliminar todos los cierres de un día específico
  async deleteAllDailyClosures(dateStr: string): Promise<void> {
    const closures = await this.getDailyClosuresForDate(dateStr)
    const deletePromises = closures.map(closure => 
      this.deleteClosureById(closure.id)
    )
    await Promise.all(deletePromises)
  }

  // Unificar cierres de un día
  async unifyDailyClosures(dateStr: string): Promise<DailyClosure> {
    const closures = await this.getDailyClosuresForDate(dateStr)
    
    if (closures.length === 0) {
      throw new Error('No hay cierres para unificar')
    }

    if (closures.length === 1) {
      return closures[0]
    }

    // Combinar todos los cierres
    const unifiedClosure = closures.reduce((unified, closure) => ({
      ...unified,
      cashCounted: unified.cashCounted + closure.cashCounted,
      cardCounted: unified.cardCounted + closure.cardCounted,
      transferCounted: unified.transferCounted + closure.transferCounted,
      totalCounted: unified.totalCounted + closure.totalCounted,
      expenses: [...unified.expenses, ...closure.expenses],
      totalExpenses: unified.totalExpenses + closure.totalExpenses,
      workModeTransactionIds: [...new Set([...unified.workModeTransactionIds, ...closure.workModeTransactionIds])],
      workModeTotal: unified.workModeTotal + closure.workModeTotal,
      difference: unified.difference + closure.difference,
      note: [unified.note, closure.note].filter(Boolean).join(' | '),
      finalBalance: unified.finalBalance + closure.finalBalance,
      unifiedFrom: [...(unified.unifiedFrom || []), ...(closure.unifiedFrom || []), closure.id]
    }), {
      ...closures[0],
      unifiedFrom: [closures[0].id]
    })

    // Eliminar cierres originales
    await this.deleteAllDailyClosures(dateStr)

    // Crear cierre unificado
    const unifiedClosureData = {
      ...unifiedClosure,
      id: `${this.userId}_${dateStr}`,
      closureNumber: undefined, // El cierre unificado no tiene número
      parentDate: dateStr,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    await this.saveDailyClosure(unifiedClosureData)
    return unifiedClosureData as DailyClosure
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
  async closeDailyBalance(dateStr: string, closureId?: string): Promise<void> {
    const targetId = closureId || `${this.userId}_${dateStr}`
    const docRef = doc(db, 'dailyClosures', targetId)
    await updateDoc(docRef, {
      status: 'closed',
      closedAt: Date.now(),
      updatedAt: Date.now()
    })
  }

  // Cerrar todos los cierres de un día
  async closeAllDailyClosures(dateStr: string): Promise<void> {
    const closures = await this.getDailyClosuresForDate(dateStr)
    const closePromises = closures.map(closure => 
      this.closeDailyBalance(dateStr, closure.id)
    )
    await Promise.all(closePromises)
  }

  // Cancelar un cierre específico (volver a estado abierto)
  async cancelDailyClosure(dateStr: string, closureId?: string): Promise<void> {
    const targetId = closureId || `${this.userId}_${dateStr}`
    const docRef = doc(db, 'dailyClosures', targetId)
    await updateDoc(docRef, {
      status: 'open',
      closedAt: undefined,
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
