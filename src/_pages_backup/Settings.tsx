"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { BookOpen, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient, type Person } from "@/lib/apiClient";
import { PeopleSection } from "@/components/PeopleSection";
import { HouseholdSection } from "@/components/HouseholdSection";

type PersonFormState = {
  name: string;
  preference: string;
  allergy: string;
};

const parseCommaSeparated = (value: string): string[] =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const toCommaSeparated = (value: string[] | undefined): string =>
  Array.isArray(value) ? value.join(", ") : "";

const SettingsPage: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { currentUser } = useAuth();
  const [showTutorial, setShowTutorial] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [isPeopleLoading, setIsPeopleLoading] = useState(false);
  const [peopleError, setPeopleError] = useState<string | null>(null);
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [newPerson, setNewPerson] = useState<PersonFormState>({
    name: "",
    preference: "",
    allergy: "",
  });
  const [editPerson, setEditPerson] = useState<PersonFormState>({
    name: "",
    preference: "",
    allergy: "",
  });

  const loadPeople = async () => {
    if (!currentUser?.uid) {
      setPeople([]);
      return;
    }

    setIsPeopleLoading(true);
    setPeopleError(null);
    try {
      const response = await apiClient.getPeople(currentUser.uid);
      setPeople(response && Array.isArray(response.people) ? response.people : []);
    } catch (err) {
      console.error("[Settings] Failed to load people", err);
      setPeopleError("Failed to load people.");
    } finally {
      setIsPeopleLoading(false);
    }
  };

  useEffect(() => {
    loadPeople();
  }, [currentUser?.uid]);

  const handleCreatePerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.uid || !newPerson.name.trim()) return;

    try {
      await apiClient.createPerson(currentUser.uid, {
        name: newPerson.name.trim(),
        preference: parseCommaSeparated(newPerson.preference),
        allergy: parseCommaSeparated(newPerson.allergy),
      });
      setNewPerson({ name: "", preference: "", allergy: "" });
      await loadPeople();
    } catch (err) {
      console.error("[Settings] Failed to create person", err);
      setPeopleError("Failed to create person.");
    }
  };

  const beginEditPerson = (person: Person) => {
    setEditingPersonId(person.person_id);
    setEditPerson({
      name: person.name,
      preference: toCommaSeparated(person.preference),
      allergy: toCommaSeparated(person.allergy),
    });
  };

  const handleUpdatePerson = async (personId: string) => {
    if (!currentUser?.uid || !editPerson.name.trim()) return;

    try {
      await apiClient.updatePerson(currentUser.uid, personId, {
        name: editPerson.name.trim(),
        preference: parseCommaSeparated(editPerson.preference),
        allergy: parseCommaSeparated(editPerson.allergy),
      });
      setEditingPersonId(null);
      await loadPeople();
    } catch (err) {
      console.error("[Settings] Failed to update person", err);
      setPeopleError("Failed to update person.");
    }
  };

  const handleDeletePerson = async (personId: string) => {
    if (!currentUser?.uid) return;

    try {
      await apiClient.deletePerson(currentUser.uid, personId);
      if (editingPersonId === personId) {
        setEditingPersonId(null);
      }
      await loadPeople();
    } catch (err) {
      console.error("[Settings] Failed to delete person", err);
      setPeopleError("Failed to delete person.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">
          {t("language")} / {t("settings")}
        </h1>

        <Card>
          <CardContent>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("language")}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setLanguage("en")}
                  className={`px-3 py-2 rounded-md border ${
                    language === "en"
                      ? "bg-red-500 text-white border-transparent"
                      : "bg-white text-gray-700"
                  }`}
                >
                  {t("englishLanguage")}
                </button>
                <button
                  onClick={() => setLanguage("th")}
                  className={`px-3 py-2 rounded-md border ${
                    language === "th"
                      ? "bg-red-500 text-white border-transparent"
                      : "bg-white text-gray-700"
                  }`}
                >
                  {t("thaiLanguage")}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {t("switchLanguageDescription")}
              </p>
            </div>

            <div className="mt-6">
              <h2 className="text-sm font-semibold mb-2">
                {t("otherSettingsPlaceholderTitle")}
              </h2>
              <p className="text-sm text-gray-600">
                {t("otherSettingsPlaceholderDescription")}
              </p>
            </div>

            <PeopleSection/>

            <HouseholdSection />

          </CardContent>
        </Card>

        {/* Getting Started Tutorial */}
        <div className="mt-6">
          <button
            onClick={() => setShowTutorial(!showTutorial)}
            className="w-full flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-all duration-300"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-red-600" />
              <h2 className="text-lg font-semibold text-red-900">
                {t("gettingStarted")}
              </h2>
            </div>
            <ChevronDown
              className={`h-5 w-5 text-red-600 transition-transform duration-300 ${
                showTutorial ? "transform rotate-180" : ""
              }`}
            />
          </button>

          {showTutorial && (
            <Card className="mt-4 border-red-200 bg-gradient-to-br from-red-50 to-white">
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {/* Step 1 */}
                  <div className="border-l-4 border-red-500 pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-8 rounded-full bg-red-500 text-white flex items-center justify-center text-sm font-semibold">
                        1
                      </div>
                      <h3 className="font-semibold text-gray-900">
                        {t("addYourFoods")}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-700 ml-10">
                      {t("addYourFoodsStepDescription")}
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="border-l-4 border-red-500 pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-8 rounded-full bg-red-500 text-white flex items-center justify-center text-sm font-semibold">
                        2
                      </div>
                      <h3 className="font-semibold text-gray-900">
                        {t("enableNotifications")}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-700 ml-10">
                      {t("enableNotificationsStepDescription")}
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="border-l-4 border-red-500 pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-8 rounded-full bg-red-500 text-white flex items-center justify-center text-sm font-semibold">
                        3
                      </div>
                      <h3 className="font-semibold text-gray-900">
                        {t("viewYourCalendarStepTitle")}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-700 ml-10">
                      {t("viewYourCalendarStepDescription")}
                    </p>
                  </div>

                  {/* Step 4 */}
                  <div className="border-l-4 border-red-500 pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-8 rounded-full bg-red-500 text-white flex items-center justify-center text-sm font-semibold">
                        4
                      </div>
                      <h3 className="font-semibold text-gray-900">
                        {t("getRecipeIdeasStepTitle")}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-700 ml-10">
                      {t("getRecipeIdeasStepDescription")}
                    </p>
                  </div>

                  {/* Tips Section */}
                  <div className="bg-white rounded-lg p-4 border border-red-100 mt-6">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      {t("proTips")}
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>{t("proTipUseCategories")}</li>
                      <li>{t("proTipCheckCalendarWeekly")}</li>
                      <li>{t("proTipAssistantSuggestRecipes")}</li>
                      <li>{t("proTipEnableNotifications")}</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
