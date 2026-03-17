import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  serverTimestamp,
  setDoc,
  getDoc
} from "firebase/firestore";
import { db } from "./firebase";

// --- CUSTOMERS ---
const customersCollection = collection(db, "customers");

export const createCustomer = async (customerData) => {
  try {
    const docRef = await addDoc(customersCollection, {
      ...customerData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating customer: ", error);
    throw error;
  }
};

// --- QUOTATIONS ---
const quotationsCollection = collection(db, "quotations");

export const createQuotation = async (quotationData) => {
  try {
    const docRef = await addDoc(quotationsCollection, {
      ...quotationData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating quotation: ", error);
    throw error;
  }
};

export const getQuotations = async () => {
  try {
    const q = query(quotationsCollection, orderBy("Metadata.createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching quotations: ", error);
    throw error;
  }
};

export const updateQuotationStatus = async (id, status) => {
  try {
    const docRef = doc(db, "quotations", id);
    await updateDoc(docRef, {
      "Status.status": status
    });
  } catch (error) {
    console.error("Error updating quotation: ", error);
    throw error;
  }
};

export const deleteQuotation = async (id) => {
  try {
    const docRef = doc(db, "quotations", id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting quotation: ", error);
    throw error;
  }
};

// --- JOB CARDS ---
const jobCardsCollection = collection(db, "jobCards");

export const createJobCard = async (jobCardData) => {
  try {
    const docRef = await addDoc(jobCardsCollection, {
      ...jobCardData,
      createdAt: serverTimestamp()
    });
    
    // Also update parent quotation status
    if (jobCardData.Reference?.quotationId) {
      await updateQuotationStatus(jobCardData.Reference.quotationId, "in_progress");
    }

    return docRef.id;
  } catch (error) {
    console.error("Error creating job card: ", error);
    throw error;
  }
};

export const getJobCards = async () => {
  try {
    const q = query(jobCardsCollection, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching job cards: ", error);
    throw error;
  }
};

export const updateJobCardStatus = async (id, status, signatures = null, quotationId = null) => {
  try {
    const docRef = doc(db, "jobCards", id);
    let updateData = { "Status.status": status };
    if (signatures) {
      updateData = { ...updateData, "Completion": signatures };
    }
    await updateDoc(docRef, updateData);
    
    // Sync the underlying quotation status if a reference ID is provided
    if (quotationId) {
      await updateQuotationStatus(quotationId, status);
    }
  } catch (error) {
    console.error("Error updating job card: ", error);
    throw error;
  }
};

export const deleteJobCard = async (id) => {
  try {
    const docRef = doc(db, "jobCards", id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting job card: ", error);
    throw error;
  }
};

// --- WORKSHOP COSTS ---
const workshopCostsCollection = collection(db, "workshopCosts");

export const saveWorkshopCost = async (costData) => {
  try {
    const docRef = await addDoc(workshopCostsCollection, {
      ...costData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving workshop cost: ", error);
    throw error;
  }
};

export const getWorkshopCosts = async () => {
  try {
    const q = query(workshopCostsCollection, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error fetching workshop costs: ", error);
    throw error;
  }
};

export const deleteWorkshopCost = async (id) => {
  try {
    const docRef = doc(db, "workshopCosts", id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting workshop cost: ", error);
    throw error;
  }
};

// --- WORKSHOP COST TEMPLATES ---
const workshopCostTemplatesCollection = collection(db, "workshopCostTemplates");

export const saveWorkshopCostTemplate = async (templateData) => {
  try {
    const docRef = await addDoc(workshopCostTemplatesCollection, {
      ...templateData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving workshop cost template: ", error);
    throw error;
  }
};

export const getWorkshopCostTemplates = async () => {
  try {
    const q = query(workshopCostTemplatesCollection, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error fetching workshop cost templates: ", error);
    throw error;
  }
};

export const deleteWorkshopCostTemplate = async (id) => {
  try {
    const docRef = doc(db, "workshopCostTemplates", id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting workshop cost template: ", error);
    throw error;
  }
};

export const getWorkshopCostTemplate = async (id) => {
  try {
    const docRef = doc(db, "workshopCostTemplates", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Error fetching single template: ", error);
    throw error;
  }
};

// --- SETTINGS ---
export const getActiveTemplateSettings = async () => {
  try {
    const docRef = doc(db, "settings", "workshop_config");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().activeTemplateId;
    }
    return null;
  } catch (error) {
    console.error("Error fetching active template settings: ", error);
    return null;
  }
};

export const setActiveTemplateSettings = async (templateId) => {
  try {
    const docRef = doc(db, "settings", "workshop_config");
    await setDoc(docRef, { activeTemplateId: templateId }, { merge: true });
    return true;
  } catch (error) {
    console.error("Error setting active template settings: ", error);
    throw error;
  }
};
