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
import YouTubeStudio from "./pages/YouTubeStudio";
import Feed from "./pages/Feed";
import Messages from "./pages/Messages";
import AIAssistant from "./pages/AIAssistant";
import VideoRecreateStudio from "./pages/VideoRecreateStudio";
import Gallery from "./pages/Gallery";
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
          <Route path="/youtube-studio" component={YouTubeStudio} />
          <Route path="/feed" component={Feed} />
          <Route path="/messages" component={Messages} />
          <Route path="/ai-assistant" component={AIAssistant} />
          <Route path="/video-recreate" component={VideoRecreateStudio} />
          <Route path="/gallery" component={Gallery} />
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
