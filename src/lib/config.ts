// Global API configuration.
// Default to same-origin proxy to avoid browser CORS.
// Optional override: NEXT_PUBLIC_API_BASE_URL
export const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || '/api/proxy';

// Backward-compatible alias for existing imports.
export const API_BASE_URL = BASE_URL;
export const API_DEBUG = false; // Toggle to true to enable API debug logs.


// Endpoint helpers
export const API_ENDPOINTS = {
  // User & Profile
  user: (uid: string) => `${API_BASE_URL}/user/${uid}`,
  getNotifications: (uid: string) => `${API_BASE_URL}/notify/get_notify/${uid}`,
  changeDisplayName: (uid: string, name: string) => `${API_BASE_URL}/change/displayname/${uid}/${name}`,
  
  // Recipes
  addRecipes: (uid: string) => `${API_BASE_URL}/add/recipes/${uid}`,
  deleteRecipe: (uid: string, recipeId: string) => `${API_BASE_URL}/delete/recipes/${uid}/${recipeId}`,
  searchRecipes: (name: string) => `${API_BASE_URL}/search/recipes?${new URLSearchParams({ name }).toString()}`,
  getRecipeById: (id: string) => `${API_BASE_URL}/search/recipes/${id}`,
  addRecipeToList: (id: string) => `${API_BASE_URL}/search/recipes/${id}/add-to-list`,
  addRecipeInfoToList: () => `${API_BASE_URL}/search/recipes/add-to-list/from-info`,
  createRecipeListFromInfo: () => `${API_BASE_URL}/search/recipes/create-list/from-info`,
  generateRecipe: () => `${API_BASE_URL}/search/recipes/generate`,
  
  // Schedules & Notifications
  addSchedules: (uid: string) => `${API_BASE_URL}/add/schedules/${uid}`,
  changeSchedules: (uid: string) => `${API_BASE_URL}/change/schedules/${uid}`,
  deleteSchedule: (uid: string, scheduleId: string) => `${API_BASE_URL}/delete/schedules/${uid}/${scheduleId}`,
  notifyOn: (uid: string, scheduleId: string) => `${API_BASE_URL}/notify/on/${uid}/${scheduleId}`,
  notifyOff: (uid: string, scheduleId: string) => `${API_BASE_URL}/notify/off/${uid}/${scheduleId}`,
  
  // Chat
  chat: (uid: string) => `${API_BASE_URL}/chat`,

  // People (settings)
  people: (uid: string) => `${API_BASE_URL}/people/${uid}`,
  updatePerson: (uid: string, personId: string) => `${API_BASE_URL}/people/${uid}/${personId}`,
  deletePerson: (uid: string, personId: string) => `${API_BASE_URL}/people/${uid}/${personId}`,

  // Household sharing
  createHousehold: () => `${API_BASE_URL}/households`,
  getMyHousehold: (uid: string) =>
    `${API_BASE_URL}/households/my?${new URLSearchParams({ member_uid: uid }).toString()}`,
  generateInvite: (householdId: string) => `${API_BASE_URL}/households/${householdId}/generate-invite`,
  redeemInvite: () => `${API_BASE_URL}/households/redeem-invite`,
  leaveHousehold: (householdId: string) => `${API_BASE_URL}/households/${householdId}/leave`,
  removeHouseholdMember: (householdId: string, memberUid: string, actorUid: string) =>
    `${API_BASE_URL}/households/${householdId}/members/${memberUid}?${new URLSearchParams({ actor_uid: actorUid }).toString()}`,
  getHouseholdSchedules: (householdId: string, memberUid: string) =>
    `${API_BASE_URL}/households/${householdId}/schedules?${new URLSearchParams({ member_uid: memberUid }).toString()}`,
  createHouseholdSchedule: (householdId: string) => `${API_BASE_URL}/households/${householdId}/schedules`,
  getHouseholdGrocery: (householdId: string, memberUid: string) =>
    `${API_BASE_URL}/households/${householdId}/grocery?${new URLSearchParams({ member_uid: memberUid }).toString()}`,
  createHouseholdGrocery: (householdId: string) => `${API_BASE_URL}/households/${householdId}/grocery`,

  // Classification
  classify: () => `${API_BASE_URL}/classify`,
  
  // Grocery Lists
  getAllGroceryLists: (uid: string) => `${API_BASE_URL}/grocery/${uid}`,
  createGroceryList: (uid: string) => `${API_BASE_URL}/grocery/${uid}`,
  getSingleGroceryList: (uid: string, listId: string) => `${API_BASE_URL}/grocery/${uid}/${listId}`,
  deleteGroceryList: (uid: string, listId: string) => `${API_BASE_URL}/grocery/${uid}/${listId}`,
  
  // Grocery Items
  addGroceryItem: (uid: string, listId: string) => `${API_BASE_URL}/grocery/${uid}/${listId}/items`,
  updateGroceryItem: (uid: string, listId: string, itemId: string) => `${API_BASE_URL}/grocery/${uid}/${listId}/items/${itemId}`,
  deleteGroceryItem: (uid: string, listId: string, itemId: string) => `${API_BASE_URL}/grocery/${uid}/${listId}/items/${itemId}`,
  convertGroceryToSchedule: (uid: string, listId: string, itemId: string) => `${API_BASE_URL}/grocery/${uid}/${listId}/items/${itemId}/to-schedule`,

  // Devices
  hardwareDevices: (uid: string) => `${API_BASE_URL}/hardware/${uid}`,
  terminatePendingHardware: (uid: string) => `${API_BASE_URL}/hardware/terminate_pending/${uid}`,
  hardwareStream: (device: string) => `${API_BASE_URL}/stream/${device}`,
  sendHardwareImage: (device: string) => `${API_BASE_URL}/hardware/send_image/${device}`,
  hardwareDevicesBatch: (uid: string) => `${API_BASE_URL}/hardware/devices/${uid}`,
  hardwareRequestsBatch: (uid: string) => `${API_BASE_URL}/hardware/requests/${uid}`,
};
