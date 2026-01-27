import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Browse from "./pages/Browse";
import VideoPage from "./pages/VideoPage";
import CreatorProfile from "./pages/CreatorProfile";
import CreatorDashboard from "./pages/CreatorDashboard";
import SubscriberDashboard from "./pages/SubscriberDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AgeVerification from "./pages/AgeVerification";
import Settings from "./pages/Settings";
import AffiliateDashboard from "./pages/AffiliateDashboard";
import PayoutSettings from "./pages/PayoutSettings";
import { useAuth } from "@/_core/hooks/useAuth";

function Router() {
  const { user, isAuthenticated } = useAuth();
  
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/browse" component={Browse} />
      <Route path="/video/:id" component={VideoPage} />
      <Route path="/creator/:id" component={CreatorProfile} />
      <Route path="/verify-age" component={AgeVerification} />
      
      {/* Protected routes */}
      {isAuthenticated && (
        <>
          <Route path="/dashboard" component={CreatorDashboard} />
          <Route path="/subscriptions" component={SubscriberDashboard} />
          <Route path="/settings" component={Settings} />
          <Route path="/affiliate" component={AffiliateDashboard} />
          <Route path="/payouts" component={PayoutSettings} />
        </>
      )}
      
      {/* Admin routes */}
      {user?.role === 'admin' && (
        <Route path="/admin" component={AdminDashboard} />
      )}
      
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
