"use client";

import React, { useEffect, useState } from "react";
import { apiClient, type Person } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Users, Plus, Pencil, Trash2, X, Check, ChefHat, AlertTriangle } from "lucide-react";

type PersonFormState = {
    name: string;
    preference: string;
    allergy: string;
};

const parseCommaSeparated = (value: string): string[] =>
    value.split(",").map((item) => item.trim()).filter(Boolean);

const toCommaSeparated = (value: string[] | undefined): string =>
    Array.isArray(value) ? value.join(", ") : "";

export const PeopleSection: React.FC = () => {
    const { currentUser } = useAuth();
    const { t } = useLanguage();
    const [people, setPeople] = useState<Person[]>([]);
    const [isPeopleLoading, setIsPeopleLoading] = useState(false);
    const [peopleError, setPeopleError] = useState<string | null>(null);
    const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newPerson, setNewPerson] = useState<PersonFormState>({ name: "", preference: "", allergy: "" });
    const [editPerson, setEditPerson] = useState<PersonFormState>({ name: "", preference: "", allergy: "" });

    const loadPeople = async () => {
        if (!currentUser?.uid) { setPeople([]); return; }
        setIsPeopleLoading(true);
        setPeopleError(null);
        try {
            const response = await apiClient.getPeople(currentUser.uid);
            setPeople(response && Array.isArray(response.people) ? response.people : []);
        } catch {
            setPeople([]);
        } finally {
            setIsPeopleLoading(false);
        }
    };

    useEffect(() => { loadPeople(); }, [currentUser?.uid]);

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
            setShowAddForm(false);
            await loadPeople();
        } catch {
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
        } catch {
            setPeopleError("Failed to update person.");
        }
    };

    const handleDeletePerson = async (personId: string) => {
        if (!currentUser?.uid) return;
        try {
            await apiClient.deletePerson(currentUser.uid, personId);
            if (editingPersonId === personId) setEditingPersonId(null);
            await loadPeople();
        } catch {
            setPeopleError("Failed to delete person.");
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-red-500" />
                    <h2 className="text-base font-semibold text-gray-800">{t("peopleTitle")}</h2>
                </div>
                <button
                    onClick={() => { setShowAddForm((v) => !v); setEditingPersonId(null); }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    {t("add")}
                </button>
            </div>
            <p className="text-xs text-gray-400 mb-4">{t("peopleManageHint")}</p>

            {/* Add Form */}
            {showAddForm && (
                <form
                    onSubmit={handleCreatePerson}
                    className="mb-5 bg-red-50 border border-red-100 rounded-xl p-4 space-y-3"
                >
                    <h3 className="text-sm font-semibold text-red-700">{t("peopleNewPerson")}</h3>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{t("peopleNameLabel")}</label>
                        <input
                            type="text"
                            value={newPerson.name}
                            onChange={(e) => setNewPerson((p) => ({ ...p, name: e.target.value }))}
                            placeholder={t("peopleNamePlaceholder")}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-300"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{t("peoplePreferencesLabel")}</label>
                        <input
                            type="text"
                            value={newPerson.preference}
                            onChange={(e) => setNewPerson((p) => ({ ...p, preference: e.target.value }))}
                            placeholder={t("peoplePreferencesPlaceholder")}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-300"
                        />
                        <p className="text-xs text-gray-400 mt-1">{t("peopleCommaSeparated")}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{t("peopleAllergiesLabel")}</label>
                        <input
                            type="text"
                            value={newPerson.allergy}
                            onChange={(e) => setNewPerson((p) => ({ ...p, allergy: e.target.value }))}
                            placeholder={t("peopleAllergiesPlaceholder")}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-300"
                        />
                        <p className="text-xs text-gray-400 mt-1">{t("peopleCommaSeparated")}</p>
                    </div>
                    <div className="flex gap-2 pt-1">
                        <button
                            type="submit"
                            disabled={!newPerson.name.trim()}
                            className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-40 transition-colors"
                        >
                            {t("peopleAddPerson")}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowAddForm(false)}
                            className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            {t("cancel")}
                        </button>
                    </div>
                </form>
            )}

            {/* Error */}
            {peopleError && (
                <p className="text-xs text-red-500 mb-3 bg-red-50 px-3 py-2 rounded-lg">{peopleError}</p>
            )}

            {/* Loading */}
            {isPeopleLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
                    <span className="w-4 h-4 border-2 border-red-300 border-t-transparent rounded-full animate-spin" />
                    {t("loading")}
                </div>
            )}

            {/* Empty state */}
            {!isPeopleLoading && people.length === 0 && !peopleError && (
                <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400">
                    <ChefHat className="w-10 h-10 mb-3 text-gray-200" />
                    <p className="text-sm font-medium">{t("peopleNoneYet")}</p>
                    <p className="text-xs mt-1">{t("peopleNoneHint")}</p>
                </div>
            )}

            {/* People list */}
            {!isPeopleLoading && (
                <div className="space-y-3">
                    {people.map((person) => {
                        const isEditing = editingPersonId === person.person_id;
                        return (
                            <div
                                key={person.person_id}
                                className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm"
                            >
                                {isEditing ? (
                                    <div className="space-y-2">
                                        <input
                                            type="text"
                                            value={editPerson.name}
                                            onChange={(e) => setEditPerson((p) => ({ ...p, name: e.target.value }))}
                                            placeholder={t("peopleNameLabel")}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-300"
                                        />
                                        <input
                                            type="text"
                                            value={editPerson.preference}
                                            onChange={(e) => setEditPerson((p) => ({ ...p, preference: e.target.value }))}
                                            placeholder={t("peoplePreferencesCommaPlaceholder")}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-300"
                                        />
                                        <input
                                            type="text"
                                            value={editPerson.allergy}
                                            onChange={(e) => setEditPerson((p) => ({ ...p, allergy: e.target.value }))}
                                            placeholder={t("peopleAllergiesCommaPlaceholder")}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-300"
                                        />
                                        <div className="flex gap-2 pt-1">
                                            <button
                                                onClick={() => handleUpdatePerson(person.person_id)}
                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600 transition-colors"
                                            >
                                                <Check className="w-3.5 h-3.5" /> {t("save")}
                                            </button>
                                            <button
                                                onClick={() => setEditingPersonId(null)}
                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                                            >
                                                <X className="w-3.5 h-3.5" /> {t("cancel")}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-sm font-semibold text-gray-800">{person.name}</h3>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => beginEditPerson(person)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                                                    title={t("edit")}
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePerson(person.person_id)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                    title={t("peopleDelete")}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Preference pills */}
                                        {person.preference?.length > 0 && (
                                            <div className="mb-2">
                                                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{t("peoplePreferencesLabel")}</span>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {person.preference.map((pref, i) => (
                                                        <span key={i} className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs border border-green-100 font-medium">
                                                            {pref}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Allergy pills */}
                                        {person.allergy?.length > 0 && (
                                            <div>
                                                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{t("peopleAllergiesLabel")}</span>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {person.allergy.map((a, i) => (
                                                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-xs border border-red-100 font-medium">
                                                            <AlertTriangle className="w-3 h-3" />
                                                            {a}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}  
                                        {person.preference?.length === 0 && person.allergy?.length === 0 && (
                                            <p className="text-xs text-gray-400">{t("peopleNoPrefsAllergies")}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default PeopleSection;