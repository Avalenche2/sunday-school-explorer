import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { GospelOfTheDay } from "@/components/home/GospelOfTheDay";
import { QuizzOfTheWeek } from "@/components/home/QuizzOfTheWeek";
import { TopJuniors } from "@/components/home/TopJuniors";
import { Schedules } from "@/components/home/Schedules";
import { Announcements } from "@/components/home/Announcements";
import { RecentQuizzes } from "@/components/home/RecentQuizzes";
import { DailyChallenge } from "@/components/home/DailyChallenge";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero / Évangile */}
        <section className="container py-8 md:py-12">
          <div className="mb-8 md:mb-10 text-center max-w-2xl mx-auto animate-fade-in-up">
            <p className="text-xs uppercase tracking-[0.3em] text-accent font-medium">
              Bienvenue
            </p>
            <h1 className="mt-3 font-serif text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.1]">
              L'École du Dimanche
            </h1>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Un espace pour grandir dans la foi, jouer aux quizz bibliques
              et découvrir chaque jour la Parole de Dieu.
            </p>
            <div className="mt-6 flex justify-center">
              <div className="gold-divider" />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <GospelOfTheDay />
              <DailyChallenge />
            </div>
            <div>
              <QuizzOfTheWeek />
            </div>
          </div>
        </section>

        {/* Top juniors + Horaires */}
        <section className="container py-6 md:py-10">
          <div className="grid gap-6 md:grid-cols-2">
            <TopJuniors />
            <Schedules />
          </div>
        </section>

        {/* Annonces + Historique */}
        <section className="container py-6 md:py-10 pb-16">
          <div className="grid gap-6 md:grid-cols-2">
            <Announcements />
            <RecentQuizzes />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
