import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Inscription from "./pages/Inscription.tsx";
import Connexion from "./pages/Connexion.tsx";
import Quizz from "./pages/Quizz.tsx";
import QuizzPlay from "./pages/QuizzPlay.tsx";
import QuizzRecap from "./pages/QuizzRecap.tsx";
import Classement from "./pages/Classement.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/inscription" element={<Inscription />} />
            <Route path="/connexion" element={<Connexion />} />
            <Route path="/quizz" element={<Quizz />} />
            <Route path="/quizz/:id" element={<QuizzPlay />} />
            <Route path="/quizz/:id/recap" element={<QuizzRecap />} />
            <Route path="/classement" element={<Classement />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
