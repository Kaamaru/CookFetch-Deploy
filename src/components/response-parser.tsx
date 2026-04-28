"use client";

"use client";

import { useState } from "react";
import {
  ChefHat,
  ClipboardList,
  Mail,
  Calendar,
  Utensils,
  User,
  ServerCrash,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "./ui/skeleton";
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiClient } from "@/lib/apiClient";
// Define interfaces for the data structure
interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  steps: string[];
  time: string | null;
}

interface Schedule {
  date: string;
  is_soon: boolean;
  name: string;
  time: string;
  expiry: string;
}

interface UserData {
  email: string;
  savedrecipes: Recipe[];
  schedules: Schedule[];
  username: string;
}
// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error("useAuth must be used within an AuthProvider");
//   }
//   return context;
// };

export function ResponseParser() {
  const { t } = useLanguage();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser, logout } = useAuth();

  const handleFetchProfile = async () => {
    setIsLoading(true);
    setError(null);
    setUserData(null);
    try {
      const data = await apiClient.getUser(currentUser.uid);
      setUserData(data as UserData);
    } catch (error) {
      setError(error instanceof Error ? error.message : t("failedToFetchData"));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive max-w-4xl mx-auto text-center">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2">
            <ServerCrash className="h-6 w-6" />
            {t("errorFetchingProfile")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-destructive">{error}</p>
          <Button variant="destructive" onClick={handleFetchProfile}>
            {t("tryAgain")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (userData) {
    const { username, email, savedrecipes, schedules } = userData;
    return (
      <div className="space-y-8 max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">
            {t("userProfile")}
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            {t("detailedViewOfUserInfo")} {username}.
          </p>
        </header>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary">
              <AvatarImage
                src={`https://api.dicebear.com/8.x/initials/svg?seed=${username}`}
                alt={username}
              />
              <AvatarFallback>
                {username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-3xl">{username}</CardTitle>
              <CardDescription className="flex items-center gap-2 pt-1 text-base">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {email}
              </CardDescription>
            </div>
          </CardHeader>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="h-6 w-6 text-primary" /> {t("savedRecipes")}
            </CardTitle>
            <CardDescription>{t("savedRecipesDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            {savedrecipes.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {savedrecipes.map((recipe) => (
                  <AccordionItem value={recipe.id} key={recipe.id}>
                    <AccordionTrigger className="text-lg hover:no-underline">
                      {recipe.name}
                    </AccordionTrigger>
                    <AccordionContent className="pl-4">
                      <div className="space-y-6">
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2 text-primary/90">
                            <Utensils className="h-5 w-5" />
                            {t("ingredients")}
                          </h4>
                          <ul className="list-disc list-inside pl-2 space-y-1 text-muted-foreground">
                            {recipe.ingredients.map((ing, i) => (
                              <li key={i}>{ing}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2 text-primary/90">
                            <ClipboardList className="h-5 w-5" />
                            {t("steps")}
                          </h4>
                          <ol className="list-decimal list-inside pl-2 space-y-1 text-muted-foreground">
                            {recipe.steps.map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ol>
                        </div>
                        {recipe.time && (
                          <Badge variant="secondary">
                            {t("cookingTime")}: {recipe.time}
                          </Badge>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <p className="text-muted-foreground">{t("noSavedRecipesYet")}</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" /> {t("schedules")}
            </CardTitle>
            <CardDescription>{t("upcomingScheduledItems")}</CardDescription>
          </CardHeader>
          <CardContent>
            {schedules.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("item")}</TableHead>
                    <TableHead>{t("date")}</TableHead>
                    <TableHead>{t("time")}</TableHead>
                    <TableHead className="text-right">{t("status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((schedule, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {schedule.name}
                      </TableCell>
                      <TableCell>{schedule.date}</TableCell>
                      <TableCell>{schedule.time}</TableCell>
                      <TableCell className="text-right">
                        {schedule.is_soon ? (
                          <Badge variant="destructive">{t("soon")}</Badge>
                        ) : (
                          <Badge variant="outline">{t("scheduled")}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground">{t("noSchedulesFound")}</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card className="shadow-lg text-center max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-center gap-2">
          <User className="h-6 w-6" /> {t("fetchUserProfile")}
        </CardTitle>
        <CardDescription>{t("fetchUserProfileDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleFetchProfile}>{t("fetchProfile")}</Button>
      </CardContent>
    </Card>
  );
}
