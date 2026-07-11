"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  BookOpen,
  ChevronDown,
  Settings2,
  Globe,
  Lightbulb,
} from "lucide-react";
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

  const langPill = (active: boolean) =>
    `flex-1 sm:flex-none rounded-full px-5 py-2 text-sm font-semibold transition-all ${
      active
        ? "bg-white text-red-600 shadow-sm"
        : "text-gray-500 hover:text-gray-800"
    }`;

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Page header */}
        <header className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
            <Settings2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {t("settings")}
            </h1>
            <p className="text-sm text-gray-500">{t("settingsSubtitle")}</p>
          </div>
        </header>

        {/* Language */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
              <Globe className="h-5 w-5 text-red-600" />
              {t("language")}
            </CardTitle>
            <p className="text-sm text-gray-500">
              {t("switchLanguageDescription")}
            </p>
          </CardHeader>
          <CardContent>
            <div className="inline-flex w-full sm:w-auto items-center gap-1 rounded-full bg-gray-100 p-1 shadow-inner">
              <button onClick={() => setLanguage("en")} className={langPill(language === "en")}>
                {t("englishLanguage")}
              </button>
              <button onClick={() => setLanguage("th")} className={langPill(language === "th")}>
                {t("thaiLanguage")}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* People */}
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <PeopleSection />
          </CardContent>
        </Card>

        {/* Household (renders its own cards) */}
        <HouseholdSection />

        {/* Getting Started Tutorial */}
        <div>
          <button
            onClick={() => setShowTutorial(!showTutorial)}
            className="w-full flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-2xl hover:bg-red-100 transition-all duration-300"
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
                  <div className="bg-white rounded-xl p-4 border border-red-100 mt-6">
                    <h4 className="flex items-center gap-2 font-semibold text-gray-900 mb-3">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      {t("proTips")}
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      {[
                        t("proTipUseCategories"),
                        t("proTipCheckCalendarWeekly"),
                        t("proTipAssistantSuggestRecipes"),
                        t("proTipEnableNotifications"),
                      ].map((tip, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                          <span>{tip}</span>
                        </li>
                      ))}
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
