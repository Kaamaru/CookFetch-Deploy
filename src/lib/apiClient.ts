//apiclient.ts

import { API_DEBUG, API_ENDPOINTS } from "@/lib/config";

export type Schedule = {
  uid: string;
  name: string;
  time: string;
  date: string;
  expiry: string;
  image_url?: string | null;
  category?: string | null;
  quantity?: string | null;
  location?: string | null;
  notify?: boolean;
  is_soon?: boolean;
};

export type AddScheduleRequest = {
  name: string;
  time: string;
  date: string;
  expiry: string;
  notify: boolean;
  category?: string;
  quantity: string;
  location?: string;
};

export type AddRecipeRequest = {
  name: string;
  ingredients: string[];
  steps: string[];
  time?: string;
  image_url?: string;
  quantity?: string;
};

export type AddRecipeResponse = {
  success?: boolean;
  message?: string;
  updated_at?: string;
  recipe?: {
    uid?: string;
    id?: string;
    name?: string;
    ingredients?: string[];
    steps?: string[];
    time?: string | null;
    image_url?: string | null;
    quantity?: string | null;
  };
  data?: unknown;
};

export type GroceryItem = {
  uid: string;
  name: string;
  quantity: string;
  unit: string;
  checked: boolean;
};

export type GroceryList = {
  list_id: string;
  list_name: string;
  items: GroceryItem[];
};

export type CreateGroceryListRequest = {
  list_name: string;
};

export type AddGroceryItemRequest = {
  name: string;
  quantity: string;
  unit: string;
};

export type UpdateGroceryItemRequest = {
  checked?: boolean;
  quantity?: string;
  unit?: string;
};

export type UserAggregate = {
  email: string;
  username: string;
  hardware?: {
    devices?: string[];
    requests?: string[];
  };
  grocery?: GroceryList[];
  people?: Person[];
  savedrecipes: Array<{
    uid: string;
    id?: string;
    name: string;
    ingredients: string[];
    steps: string[];
    time?: string | null;
    image_url?: string | null;
    quantity?: string | null;
  }>;
  schedules: Schedule[];
};

export type Person = {
  person_id: string;
  name: string;
  preference: string[];
  allergy: string[];
};

export type CreatePersonRequest = {
  name: string;
  preference?: string[];
  allergy?: string[];
};

export type UpdatePersonRequest = {
  name?: string;
  preference?: string[];
  allergy?: string[];
};

export type RecipeSearchData = {
  id: string;
  name?: string;
  dishName?: string;
  ingredients?: Record<string, string>;
  nutrition?: Record<string, string>;
  description?: string;
  summary?: string;
  title?: string;
  recipeName?: string;
  image?: string;
  image_url?: string | null;
  imageUrl?: string;
  portions?: Record<string, string>;
  steps?: string[];
  preparationSteps?: string[];
  calories?: string;
};

export type RecipeSearchMatchInfo = {
  matched_from: string;
  score: number;
  confidence?: "exact" | "high" | "low";
};

export type RecipeSearchResponse = {
  status: "found" | "not_found" | "generating";
  data: RecipeSearchData | null;
  match_info: RecipeSearchMatchInfo | null;
  retry_after?: number | null;
};

export type GenerateRecipeResponse = {
  status: "found" | "failed";
  data: RecipeSearchData | null;
  match_info?: RecipeSearchMatchInfo | null;
};

export type AddToListResponse = {
  status: "success" | "failed";
  message: string;
  data?: {
    items_added?: number;
  };
};

export type ClassificationResult = {
  dishName: string;
  ingredients: Record<string, string>;
  calories?: string;
  nutrients?: {
    protein?: string;
    carbs?: string;
    fat?: string;
    fiber?: string;
  };
};

export type BatchDetectItem = {
  name_th: string;
  name_en: string;
  category: string;
  estimated_quantity: string;
  unit: string;
  confidence: number;
  /** Server-computed expiry (YYYY-MM-DD); the model never guesses this. */
  suggested_expiry: string;
  source_image_index: number;
};

export type BatchDetectResponse = {
  items: BatchDetectItem[];
  image_count: number;
};

export type LineLinkCodeResponse = {
  code: string;
  expires_at: string;
  expires_in_minutes: number;
};

export type LineStatusResponse = {
  linked: boolean;
};

export type TestNotificationResponse = {
  success: boolean;
  item_count: number;
  used_test_item: boolean;
  any_channel: boolean;
  email: { attempted: boolean; to?: string; reason?: string };
  line: { attempted: boolean; ok?: boolean; error?: string; reason?: string };
};

export type CreateListFromInfoResponse = {
  status: "success" | "failed";
  message: string;
  data?: {
    recipe_name?: string;
    userid?: string;
    list_id?: string;
    list_name?: string;
    items_added?: number;
    nutrition_received?: boolean;
  };
};
export type PeopleContextItem = {
  name: string;
  preference: string[];
  allergy: string[];
};

export type ChatRequest = {
  history: any[];
  prompt: { text: string };
  promptlanguage: string;
  userid?: string;
  selected_people_ids?: string[];
  people_context?: PeopleContextItem[];  // add this
};

export type ChatResponse = {
  dishes: Array<{
    dishName: string;
    portions: Record<string, string>;
    preparationSteps: string[];
  }>;
};

export type UserHardwareResponse = {
  devices?: string[];
  requests?: string[];
};

export type GenericApiResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  data?: unknown;
  classification_result?: string;
  count?: number;
  schedules?: Schedule[];
  list?: GroceryList;
  lists?: GroceryList[];
  schedule?: Schedule;
  devices?: string[];
  requests?: string[];
  people?: Person[];
};

type RequestInitJson = Omit<RequestInit, "body"> & {
  body?: unknown;
  silent404?: boolean;
};

function getMethod(init: RequestInitJson): string {
  return (init.method || "GET").toUpperCase();
}

function buildBodyPreview(body: unknown): string | undefined {
  if (body === undefined) return undefined;
  if (body instanceof FormData) return "[FormData]";
  if (body instanceof Blob) return `[Blob size=${body.size}]`;
  if (typeof body === "string") return body.slice(0, 200);

  try {
    return JSON.stringify(body).slice(0, 200);
  } catch {
    return "[Unserializable Body]";
  }
}

function logApiDebug(kind: "request" | "success" | "error", details: Record<string, unknown>) {
  if (!API_DEBUG) return;
  const prefix = `[api:${kind}]`;

  const hasDetails = details && Object.keys(details).length > 0;

  if (!hasDetails) return;

  if (kind === "error") {
    console.error(prefix, details);
    return;
  }
  console.info(prefix, details);
}

async function apiRequest<T>(url: string, init: RequestInitJson = {}): Promise<T> {
  const method = getMethod(init);
  const startedAt = Date.now();
  const headers = new Headers(init.headers);

  if (
    init.body !== undefined &&
    !(init.body instanceof FormData) &&
    !(init.body instanceof Blob) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  let requestBody: BodyInit | null | undefined;
  if (init.body === undefined) {
    requestBody = undefined;
  } else if (
    init.body instanceof FormData ||
    init.body instanceof Blob ||
    typeof init.body === "string" ||
    init.body instanceof URLSearchParams ||
    init.body instanceof ArrayBuffer ||
    ArrayBuffer.isView(init.body)
  ) {
    requestBody = init.body as BodyInit;
  } else {
    requestBody = JSON.stringify(init.body);
  }

  logApiDebug("request", {
    method,
    url,
    bodyPreview: buildBodyPreview(init.body),
  });

  const response = await fetch(url, {
    ...init,
    headers,
    body: requestBody,
  });

  const durationMs = Date.now() - startedAt;

  if (!response.ok) {
    const isHouseholdBootstrap404 = response.status === 404 && url.includes("/households/my");

    if (response.status === 404 && (init.silent404 || isHouseholdBootstrap404)) {
      return null as T;
    }

    const message = await response.text().catch(() => "");
    logApiDebug("error", {
      method,
      url,
      status: response.status,
      durationMs,
      responsePreview: message.slice(0, 300),
    });
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    logApiDebug("success", {
      method,
      url,
      status: response.status,
      durationMs,
      empty: true,
    });
    return undefined as T;
  }

  const data = (await response.json()) as T;
  logApiDebug("success", {
    method,
    url,
    status: response.status,
    durationMs,
    keys:
      data && typeof data === "object" ? Object.keys(data as Record<string, unknown>) : undefined,
  });

  return data;
}

function buildLegacyScheduleUpdatePayload(scheduleKey: string, patch: Record<string, string>) {
  return {
    fields: {
      schedules: {
        mapValue: {
          fields: {
            [scheduleKey]: {
              mapValue: {
                fields: Object.fromEntries(
                  Object.entries(patch).map(([key, value]) => [key, { stringValue: value }])
                ),
              },
            },
          },
        },
      },
    },
  };
}

export type HouseholdData = {
  household_id: string;
  name: string;
  host: string;
  members: string[];
  is_host: boolean;
  created_at?: string;
};

export type GenerateInviteResponse = {
  success: boolean;
  invite_code: string;
  household_id: string;
  expires_at: string;
};

export type HouseholdSchedulesResponse = {
  success: boolean;
  schedules: Schedule[];
  count: number;
};

export type HouseholdLookupResponse = Partial<HouseholdData> & {
  household_id: string | null;
  success?: boolean;
};

export const apiClient = {
  getUser(uid: string, signal?: AbortSignal) {
    return apiRequest<UserAggregate>(API_ENDPOINTS.user(uid), { method: "GET", signal });
  },
  getMyHousehold(uid: string) {
    return apiRequest<HouseholdLookupResponse>(API_ENDPOINTS.getMyHousehold(uid), {
      method: "GET",
      silent404: true,
    });
  },
  createHousehold(owner_uid: string, name: string) {
    return apiRequest<{ success: boolean; household_id: string; name: string }>(
      API_ENDPOINTS.createHousehold(),
      {
        method: "POST",
        body: { owner_uid, name },
      }
    );
  },
  generateInvite(householdId: string, actorUid: string) {
    return apiRequest<GenerateInviteResponse>(API_ENDPOINTS.generateInvite(householdId), {
      method: "POST",
      body: { actor_uid: actorUid },
    });
  },
  redeemInvite(inviteCode: string, memberUid: string) {
    return apiRequest<{ success: boolean; household_id: string; name: string }>(
      API_ENDPOINTS.redeemInvite(),
      {
        method: "POST",
        body: { invite_code: inviteCode, member_uid: memberUid },
      }
    );
  },
  leaveHousehold(householdId: string, memberUid: string) {
    return apiRequest<{ success: boolean; message: string }>(
      API_ENDPOINTS.leaveHousehold(householdId),
      {
        method: "POST",
        body: { member_uid: memberUid },
      }
    );
  },
  removeMember(householdId: string, memberUid: string, actorUid: string) {
    return apiRequest<{ success: boolean; message: string }>(
      API_ENDPOINTS.removeHouseholdMember(householdId, memberUid, actorUid),
      {
        method: "DELETE",
      }
    );
  },
  getHouseholdSchedules(householdId: string, memberUid: string) {
    return apiRequest<HouseholdSchedulesResponse>(
      API_ENDPOINTS.getHouseholdSchedules(householdId, memberUid),
      {
        method: "GET",
      }
    );
  },
  addHouseholdSchedule(householdId: string, body: any) {
    return apiRequest<GenericApiResponse>(API_ENDPOINTS.createHouseholdSchedule(householdId), {
      method: "POST",
      body,
    });
  },
  addRecipe(uid: string, body: AddRecipeRequest) {
    return apiRequest<AddRecipeResponse>(API_ENDPOINTS.addRecipes(uid), {
      method: "PATCH",
      body,
    });
  },
  sendChatRequest(uid: string, body: ChatRequest) {
    return apiRequest<ChatResponse>(API_ENDPOINTS.chat(uid), {
      method: "POST",
      body,
    });
  },
  getPeople(uid: string) {
    return apiRequest<GenericApiResponse>(API_ENDPOINTS.people(uid), {
      method: "GET",
      silent404: true,
    });
  },
  createPerson(uid: string, body: CreatePersonRequest) {
    return apiRequest<GenericApiResponse>(API_ENDPOINTS.people(uid), {
      method: "POST",
      body,
    });
  },
  updatePerson(uid: string, personId: string, body: UpdatePersonRequest) {
    return apiRequest<GenericApiResponse>(API_ENDPOINTS.updatePerson(uid, personId), {
      method: "PATCH",
      body,
    });
  },
  deletePerson(uid: string, personId: string) {
    return apiRequest<GenericApiResponse>(API_ENDPOINTS.deletePerson(uid, personId), {
      method: "DELETE",
    });
  },
  addSchedule(uid: string, body: AddScheduleRequest) {
    return apiRequest<GenericApiResponse>(API_ENDPOINTS.addSchedules(uid), {
      method: "PATCH",
      body,
    });
  },
  changeDisplayName(uid: string, name: string) {
    return apiRequest<GenericApiResponse>(API_ENDPOINTS.changeDisplayName(uid, name), {
      method: "PATCH",
    });
  },
  deleteRecipe(uid: string, recipeId: string, signal?: AbortSignal) {
    return apiRequest<void>(API_ENDPOINTS.deleteRecipe(uid, recipeId), {
      method: "DELETE",
      signal,
    });
  },
  deleteSchedule(uid: string, scheduleId: string) {
    return apiRequest<void>(API_ENDPOINTS.deleteSchedule(uid, scheduleId), {
      method: "DELETE",
    });
  },
  notifyOn(uid: string, scheduleId: string) {
    return apiRequest<GenericApiResponse>(API_ENDPOINTS.notifyOn(uid, scheduleId), {
      method: "PATCH",
    });
  },
  notifyOff(uid: string, scheduleId: string) {
    return apiRequest<GenericApiResponse>(API_ENDPOINTS.notifyOff(uid, scheduleId), {
      method: "PATCH",
    });
  },
  sendTestNotification(uid: string) {
    return apiRequest<TestNotificationResponse>(API_ENDPOINTS.testNotification(uid), {
      method: "POST",
    });
  },
  getNotifications(uid: string) {
    return apiRequest<GenericApiResponse>(API_ENDPOINTS.getNotifications(uid), {
      method: "GET",
      silent404: true,
    });
  },
  getHardwareDevices(uid: string) {
    return apiRequest<UserHardwareResponse>(API_ENDPOINTS.hardwareDevices(uid), {
      method: "GET",
    });
  },
  fetchHardwareStream(device: string) {
    return fetch(API_ENDPOINTS.hardwareStream(device));
  },
  terminatePendingHardware(uid: string) {
    return apiRequest<GenericApiResponse>(API_ENDPOINTS.terminatePendingHardware(uid), {
      method: "POST",
    });
  },
  addHardwareDevices(uid: string, payload: string[]) {
    return apiRequest<GenericApiResponse>(API_ENDPOINTS.hardwareDevicesBatch(uid), {
      method: "POST",
      body: payload,
    });
  },
  removeHardwareDevices(uid: string, payload: string[]) {
    return apiRequest<GenericApiResponse>(API_ENDPOINTS.hardwareDevicesBatch(uid), {
      method: "DELETE",
      body: payload,
    });
  },
  patchHardwareRequests(uid: string, payload: string[]) {
    return apiRequest<GenericApiResponse>(API_ENDPOINTS.hardwareRequestsBatch(uid), {
      method: "PATCH",
      body: payload,
    });
  },
  removeHardwareRequests(uid: string, payload: string[]) {
    return apiRequest<GenericApiResponse>(API_ENDPOINTS.hardwareRequestsBatch(uid), {
      method: "DELETE",
      body: payload,
    });
  },
  sendHardwareImage(device: string, body: Blob | FormData) {
    return apiRequest<GenericApiResponse>(API_ENDPOINTS.sendHardwareImage(device), {
      method: "POST",
      body,
    });
  },
  getAllGroceryLists(uid: string) {
    return apiRequest<GenericApiResponse>(API_ENDPOINTS.getAllGroceryLists(uid), {
      method: "GET",
    });
  },
  searchRecipes(term: string, signal?: AbortSignal) {
    return apiRequest<RecipeSearchResponse>(API_ENDPOINTS.searchRecipes(term), {
      method: "GET",
      signal,
    });
  },
  generateRecipe(name: string) {
    return apiRequest<GenerateRecipeResponse>(API_ENDPOINTS.generateRecipe(), {
      method: "POST",
      body: { name },
    });
  },
  fetchRecipeDetails(recipeId: string, signal?: AbortSignal) {
    return apiRequest<RecipeSearchData>(API_ENDPOINTS.getRecipeById(recipeId), {
      method: "GET",
      signal,
    });
  },
  createGroceryList(uid: string, body: CreateGroceryListRequest) {
    return apiRequest<{ success: boolean; list?: GroceryList; error?: string }>(
      API_ENDPOINTS.createGroceryList(uid),
      {
        method: "POST",
        body,
      }
    );
  },
  deleteGroceryList(uid: string, listId: string) {
    return apiRequest<GenericApiResponse>(API_ENDPOINTS.deleteGroceryList(uid, listId), {
      method: "DELETE",
    });
  },
  addGroceryItem(uid: string, listId: string, body: AddGroceryItemRequest & { checked?: boolean }) {
    return apiRequest<GenericApiResponse>(API_ENDPOINTS.addGroceryItem(uid, listId), {
      method: "PATCH",
      body,
    });
  },
  deleteGroceryItem(uid: string, listId: string, itemId: string) {
    return apiRequest<GenericApiResponse>(API_ENDPOINTS.deleteGroceryItem(uid, listId, itemId), {
      method: "DELETE",
    });
  },
  updateGroceryItem(uid: string, listId: string, itemId: string, body: UpdateGroceryItemRequest) {
    return apiRequest<GenericApiResponse>(API_ENDPOINTS.updateGroceryItem(uid, listId, itemId), {
      method: "PATCH",
      body,
    });
  },
  convertGroceryToSchedule(
    uid: string,
    listId: string,
    itemId: string,
    body: { date: string; time: string; expiry: string; category?: string; location?: string }
  ) {
    return apiRequest<GenericApiResponse>(API_ENDPOINTS.convertGroceryToSchedule(uid, listId, itemId), {
      method: "POST",
      body,
    });
  },
  addRecipeToList(recipeId: string, body: { userid: string; list_id: string }) {
    return apiRequest<AddToListResponse>(API_ENDPOINTS.addRecipeToList(recipeId), {
      method: "POST",
      body,
    });
  },
  classifyImage(formData: FormData, information?: string) {
    const baseUrl = API_ENDPOINTS.classify();
    const query = information?.trim()
      ? `?${new URLSearchParams({ information: information.trim() }).toString()}`
      : "";

    return apiRequest<ClassificationResult>(`${baseUrl}${query}`, {
      method: "POST",
      body: formData,
    });
  },
  createRecipeListFromInfo(body: {
    userid: string;
    recipe_name: string;
    ingredients: Record<string, string>;
    nutrition?: Record<string, string>;
  }) {
    return apiRequest<CreateListFromInfoResponse>(API_ENDPOINTS.createRecipeListFromInfo(), {
      method: "POST",
      body,
    });
  },
  batchDetect(formData: FormData) {
    return apiRequest<BatchDetectResponse>(API_ENDPOINTS.batchDetect(), {
      method: "POST",
      body: formData,
    });
  },
  generateLineLinkCode(userid: string) {
    return apiRequest<LineLinkCodeResponse>(API_ENDPOINTS.lineLinkCode(), {
      method: "POST",
      body: { userid },
    });
  },
  getLineStatus(uid: string) {
    return apiRequest<LineStatusResponse>(API_ENDPOINTS.lineStatus(uid), {
      method: "GET",
    });
  },
  updateSchedule(uid: string, scheduleKey: string, patch: Record<string, string>) {
    return apiRequest<unknown>(API_ENDPOINTS.changeSchedules(uid), {
      method: "PATCH",
      body: buildLegacyScheduleUpdatePayload(scheduleKey, patch),
    });
  },
};