"use client";

import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";

export type RecipeDetailModel = {
  id: string;
  title: string;
  description: string;
  image?: string;
  ingredients: string[];
  steps: string[];
};

type Props = {
  recipe: RecipeDetailModel | null;
};

export default function RecipeDetailView({ recipe }: Props) {
  const { t } = useLanguage();

  if (!recipe) {
    return (
      <section aria-labelledby="recipe-not-found-heading" className="p-6">
        <h1
          id="recipe-not-found-heading"
          className="text-2xl font-bold text-gray-900"
        >
          {t("recipeDetailNotFoundTitle")}
        </h1>
        <p className="mt-2 text-gray-600">
          {t("recipeDetailNotFoundDescription")}
        </p>
      </section>
    );
  }

  return (
    <article
      className="max-w-4xl mx-auto px-4 py-8"
      aria-labelledby="recipe-title"
    >
      <header>
        <h1 id="recipe-title" className="text-3xl font-bold text-gray-900">
          {recipe.title}
        </h1>
        <p className="mt-2 text-gray-600">
          {recipe.description ||
            t("recipeDetailDefaultDescription", { title: recipe.title })}
        </p>
      </header>

      {recipe.image ? (
        <section className="mt-6" aria-label={t("recipeImageAriaLabel")}>
          <div className="relative h-64 w-full overflow-hidden rounded-xl border border-red-100 bg-white">
            <Image
              src={recipe.image}
              alt={recipe.title}
              fill
              sizes="(max-width: 768px) 100vw, 896px"
              className="object-cover"
              priority
            />
          </div>
        </section>
      ) : null}

      <section className="mt-8" aria-labelledby="ingredients-heading">
        <h2
          id="ingredients-heading"
          className="text-xl font-semibold text-gray-900"
        >
          {t("ingredients")}
        </h2>
        {recipe.ingredients.length > 0 ? (
          <ul className="mt-3 list-disc space-y-2 pl-5 text-gray-700">
            {recipe.ingredients.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-gray-600">{t("recipeDetailNoIngredients")}</p>
        )}
      </section>

      <section className="mt-8" aria-labelledby="preparation-heading">
        <h2
          id="preparation-heading"
          className="text-xl font-semibold text-gray-900"
        >
          {t("preparation")}
        </h2>
        {recipe.steps.length > 0 ? (
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-gray-700">
            {recipe.steps.map((step, index) => (
              <li key={`${step}-${index}`}>{step}</li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-gray-600">{t("recipeDetailNoPreparation")}</p>
        )}
      </section>
    </article>
  );
}
