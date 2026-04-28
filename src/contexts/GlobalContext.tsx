'use client';

// src/context/GlobalContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { apiClient, type Person, type HouseholdData } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";

export type HouseholdLifecycleState =
  | "loading"
  | "no_household"
  | "has_household"
  | "error";

interface FoodItem {
  id?: string;
  name: string;
  category: string;
  expiryDate: string;
  daysUntilExpiry: number;
  quantity: string;
  purchaseDate?: string;
  time?: string;
  notify?: boolean;
  imageUrl?: string;
}

// Add other shared state types here
interface GlobalContextType {
  concatenatedString: string;
  setConcatenatedString: (value: string) => void;
  recipes: any[];
  setRecipes: (value: any[]) => void;
  people: Person[];
  setPeople: (value: Person[]) => void;
  loadPeople: (uid: string) => Promise<void>;
  household: HouseholdData | null;
  setHousehold: (value: HouseholdData | null) => void;
  householdState: HouseholdLifecycleState;
  setHouseholdState: (value: HouseholdLifecycleState) => void;
  loadHousehold: (uid: string) => Promise<void>;
  promptLanguage: string;
  setPromptLanguage: (value: string) => void;
  demoFoods: FoodItem[];
  setDemoFoods: (value: FoodItem[]) => void;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { currentUser } = useAuth();
  const [concatenatedString, setConcatenatedString] = useState("");
  const [promptLanguage, setPromptLanguage] = useState("en");
  const [recipes, setRecipes] = useState<any[]>([]); // Replace `any` with `Recipe` type if you have it
  const [people, setPeople] = useState<Person[]>([]);
  const [household, setHousehold] = useState<HouseholdData | null>(null);
  const [householdState, setHouseholdState] =
    useState<HouseholdLifecycleState>("loading");
  const [demoFoods, setDemoFoods] = useState<FoodItem[]>([
    {
      id: "demo-1",
      name: "Milk",
      category: "Dairy",
      expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      daysUntilExpiry: 2,
      quantity: "1L",
      notify: true,
    },
    {
      id: "demo-2",
      name: "Broccoli",
      category: "Vegetables",
      expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      daysUntilExpiry: 5,
      quantity: "1 bunch",
      notify: false,
    },
    {
      id: "demo-3",
      name: "Chicken Breast",
      category: "Meat",
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      daysUntilExpiry: 7,
      quantity: "500g",
      notify: true,
    },
    {
      id: "demo-4",
      name: "Eggs",
      category: "Dairy",
      expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      daysUntilExpiry: 10,
      quantity: "12 pieces",
      notify: false,
    },
  ]);

  const loadPeople = async (uid: string) => {
    try {
      const response = await apiClient.getPeople(uid);
      setPeople(response && Array.isArray(response.people) ? response.people : []);
    } catch (error) {
      setPeople([]);
    }
  };

  const loadHousehold = async (uid: string) => {
    setHouseholdState("loading");

    try {
      const response = await apiClient.getMyHousehold(uid);

      if (!response || !response.household_id) {
        setHousehold(null);
        setHouseholdState("no_household");
        return;
      }

      setHousehold({
        household_id: response.household_id,
        name: response.name ?? "",
        host: response.host ?? "",
        members: Array.isArray(response.members) ? response.members : [],
        is_host: Boolean(response.is_host),
        created_at: response.created_at,
      });
      setHouseholdState("has_household");
    } catch (error) {
      setHousehold(null);
      setHouseholdState("error");
    }
  };

  useEffect(() => {
    if (currentUser?.uid) {
      loadPeople(currentUser.uid);
      loadHousehold(currentUser.uid);
    } else {
      setPeople([]);
      setHousehold(null);
      setHouseholdState("no_household");
    }
  }, [currentUser?.uid]);

  return (
    <GlobalContext.Provider
      value={{
        concatenatedString,
        setConcatenatedString,
        recipes,
        setRecipes,
        people,
        setPeople,
        loadPeople,
        household,
        setHousehold,
        householdState,
        setHouseholdState,
        loadHousehold,
        promptLanguage,
        setPromptLanguage,
        demoFoods,
        setDemoFoods,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error("useGlobalContext must be used within a GlobalProvider");
  }
  return context;
};
