import { Switch, Route, useLocation } from "wouter";
import { RoleProvider, useRole } from "@/contexts/RoleContext";
import { AdminModeProvider } from "@/contexts/AdminModeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { AIGreeting } from "@/components/AIGreeting";
import { Layout } from "@/components/layout/Layout";
import { ModeSelector } from "@/components/ModeSelector";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Toaster } from "@/components/Toaster";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { lazy, Suspense, useEffect, useRef, type LazyExoticComponent, type ComponentType } from "react";
import { toast } from "@/hooks/use-toast";
import { isRouteAllowed } from "@/lib/role-routes";

const DashboardPage = lazy(() => import("@/pages/dashboard"));
const GrowthAnalyticsPage = lazy(() => import("@/pages/growth"));
const MachineCatalogPage = lazy(() => import("@/pages/machines"));
const SupplierManagementPage = lazy(() => import("@/pages/suppliers"));
const SalesPipelinePage = lazy(() => import("@/pages/sales-pipeline-live"));
const SalesTasksPage = lazy(() => import("@/pages/sales-tasks"));
const SalesSequencesPage = lazy(() => import("@/pages/sales-sequences"));
const DemoSchedulerPage = lazy(() => import("@/pages/demo-scheduler"));
const MeetingBookingPage = lazy(() => import("@/pages/meeting-booking"));
const LeadImportsPage = lazy(() => import("@/pages/lead-imports"));
const MapViewPage = lazy(() => import("@/pages/map-view"));
const QuotationLogsPage = lazy(() => import("@/pages/quotations-live"));
const QuotationMakerPage = lazy(() => import("@/pages/quotation-maker"));
const AIControlCenterPage = lazy(() => import("@/pages/ai-control"));
const BuddyDashboardPage = lazy(() => import("@/pages/buddy"));
const BuddyRulesPage = lazy(() => import("@/pages/buddy-rules"));
const MarketingContentPage = lazy(() => import("@/pages/marketing-content"));
const LeadIntelligencePage = lazy(() => import("@/pages/lead-intelligence-live"));
const OutreachTemplatesPage = lazy(() => import("@/pages/outreach-templates"));
const BuddyParivarPage = lazy(() => import("@/pages/buddy-family"));
const UserManagementPage = lazy(() => import("@/pages/users-live"));
const FeedbackPage = lazy(() => import("@/pages/feedback"));
const SettingsPage = lazy(() => import("@/pages/settings"));
const ReportCardPage = lazy(() => import("@/pages/report-card"));
const GraphsPage = lazy(() => import("@/pages/graphs"));
const ServiceManagerPage = lazy(() => import("@/pages/service-manager"));
const PowerDashboardPage = lazy(() => import("@/pages/power-dashboard"));
const AdminHealthPage = lazy(() => import("@/pages/admin-health"));
const TestingLabPage = lazy(() => import("@/pages/testing"));
const WaBetaTestingPage = lazy(() => import("@/pages/wa-beta-testing"));
const ProductManagerPage = lazy(() => import("@/pages/product-manager"));
const AIToolsPage = lazy(() => import("@/pages/ai-tools"));
const AIPhotoSolutionPage = lazy(() => import("@/pages/ai-photo-solution"));
const PLCErrorCodesPage = lazy(() => import("@/pages/plc-error-codes"));
const UsedMachinesMarketplacePage = lazy(() => import("@/pages/used-machines-marketplace"));
const AIQualityCheckerPage = lazy(() => import("@/pages/ai-quality-checker"));
const RatingsPage = lazy(() => import("@/pages/ratings"));

const LoginPage = lazy(() => import("@/pages/login"));
const RegisterPage = lazy(() => import("@/pages/register"));
const ForgotPasswordPage = lazy(() => import("@/pages/forgot-password"));
const RoleSelectPage = lazy(() => import("@/pages/role-select"));
const HomePage = lazy(() => import("@/pages/home"));
const AIQuotePage = lazy(() => import("@/pages/ai-quote"));
const QuoteAnalyzerPage = lazy(() => import("@/pages/quote-analyzer"));
const CustomProfilePage = lazy(() => import("@/pages/custom-profile"));
const MachineGuidePage = lazy(() => import("@/pages/machine-guide"));
const MaintenanceGuidePage = lazy(() => import("@/pages/maintenance-guide"));
const ProjectReportPage = lazy(() => import("@/pages/project-report"));
const LandingPage = lazy(() => import("@/pages/landing"));
const SplashPage = lazy(() => import("@/pages/splash"));
const PrivacyPolicyPage = lazy(() => import("@/pages/privacy-policy"));
const TermsPage = lazy(() => import("@/pages/terms"));
const SupportPage = lazy(() => import("@/pages/support"));
const OnboardingPage = lazy(() => import("@/pages/onboarding"));

function PageLoader() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-20">
      <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>
      <p className="text-muted-foreground">Page not found</p>
    </div>
  );
}

function RoutePage({ Component }: { Component: LazyExoticComponent<ComponentType> }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Component />
      </Suspense>
    </ErrorBoundary>
  );
}

function PublicRoute({ Component }: { Component: LazyExoticComponent<ComponentType> }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

function GlobalErrorHandlers() {
  const toastRef = useRef<typeof toast | null>(null);

  useEffect(() => {
    toastRef.current = toast;

    const handleError = (event: ErrorEvent) => {
      console.error("[Global] Uncaught error:", event.error);
      toastRef.current?.({
        title: "Unexpected Error",
        description: "Something went wrong. Please refresh the page if things look broken.",
        variant: "destructive",
      });
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error("[Global] Unhandled promise rejection:", event.reason);
      toastRef.current?.({
        title: "Unexpected Error",
        description: "An unhandled error occurred. Some features may not work correctly.",
        variant: "destructive",
      });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null;
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) return <PageLoader />;
  if (!user) return <PageLoader />;

  return <>{children}</>;
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user && user.userType !== "admin") {
      toast({ title: "Access Denied", description: "Yeh page sirf admin ke liye hai.", variant: "destructive" });
      setLocation("/home");
    }
    if (!isLoading && !user) {
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) return <PageLoader />;
  if (!user || user.userType !== "admin") return <PageLoader />;

  return <>{children}</>;
}

function RoleGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { role } = useRole();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!user) return;
    if (!isRouteAllowed(location, role)) {
      setLocation("/home");
    }
  }, [location, role, user, setLocation]);

  return <>{children}</>;
}

function AppRoutes() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      const path = window.location.pathname;
      const publicPaths = ["/", "/about", "/login", "/register", "/forgot-password", "/role-select"];
      if (!publicPaths.includes(path)) {
        setLocation("/");
      }
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) return <PageLoader />;

  return (
    <Switch>
      <Route path="/">{() => <PublicRoute Component={SplashPage} />}</Route>
      <Route path="/about">{() => <PublicRoute Component={LandingPage} />}</Route>
      <Route path="/login">{() => <PublicRoute Component={LoginPage} />}</Route>
      <Route path="/register">{() => <PublicRoute Component={RegisterPage} />}</Route>
      <Route path="/forgot-password">{() => <PublicRoute Component={ForgotPasswordPage} />}</Route>
      <Route path="/onboarding">{() => <PublicRoute Component={OnboardingPage} />}</Route>
      <Route path="/privacy-policy">{() => <PublicRoute Component={PrivacyPolicyPage} />}</Route>
      <Route path="/terms">{() => <PublicRoute Component={TermsPage} />}</Route>
      <Route path="/support">{() => <PublicRoute Component={SupportPage} />}</Route>
      <Route path="/role-select">
        {() => (
          <AuthGuard>
            <PublicRoute Component={RoleSelectPage} />
          </AuthGuard>
        )}
      </Route>
      <Route path="/home">
        {() => (
          <AuthGuard>
            <PublicRoute Component={HomePage} />
          </AuthGuard>
        )}
      </Route>
      <Route path="/ai-quote">
        {() => (
          <AuthGuard>
            <PublicRoute Component={AIQuotePage} />
          </AuthGuard>
        )}
      </Route>
      <Route path="/quote-analyzer">
        {() => (
          <AuthGuard>
            <PublicRoute Component={QuoteAnalyzerPage} />
          </AuthGuard>
        )}
      </Route>
      <Route path="/custom-profile">
        {() => (
          <AuthGuard>
            <PublicRoute Component={CustomProfilePage} />
          </AuthGuard>
        )}
      </Route>
      <Route path="/machine-guide">
        {() => (
          <AuthGuard>
            <PublicRoute Component={MachineGuidePage} />
          </AuthGuard>
        )}
      </Route>
      <Route path="/maintenance-guide">
        {() => (
          <AuthGuard>
            <PublicRoute Component={MaintenanceGuidePage} />
          </AuthGuard>
        )}
      </Route>
      <Route path="/ai-photo-solution">
        {() => (
          <AuthGuard>
            <PublicRoute Component={AIPhotoSolutionPage} />
          </AuthGuard>
        )}
      </Route>
      <Route path="/plc-error-codes">
        {() => (
          <AuthGuard>
            <PublicRoute Component={PLCErrorCodesPage} />
          </AuthGuard>
        )}
      </Route>
      <Route path="/used-machines-marketplace">
        {() => (
          <AuthGuard>
            <PublicRoute Component={UsedMachinesMarketplacePage} />
          </AuthGuard>
        )}
      </Route>
      <Route path="/ai-quality-checker">
        {() => (
          <AuthGuard>
            <PublicRoute Component={AIQualityCheckerPage} />
          </AuthGuard>
        )}
      </Route>
      <Route path="/ratings">
        {() => (
          <AuthGuard>
            <PublicRoute Component={RatingsPage} />
          </AuthGuard>
        )}
      </Route>
      <Route path="/project-report">
        {() => (
          <AuthGuard>
            <PublicRoute Component={ProjectReportPage} />
          </AuthGuard>
        )}
      </Route>
      <Route path="/select-mode">
        {() => (
          <AuthGuard>
            <ModeSelector />
          </AuthGuard>
        )}
      </Route>
      <Route>
        {() => (
          <AuthGuard>
            <RoleGuard>
            <Layout>
              <Switch>
                <Route path="/">{() => <RoutePage Component={DashboardPage} />}</Route>
                <Route path="/growth">{() => <RoutePage Component={GrowthAnalyticsPage} />}</Route>
                <Route path="/machines">{() => <RoutePage Component={MachineCatalogPage} />}</Route>
                <Route path="/suppliers">{() => <RoutePage Component={SupplierManagementPage} />}</Route>
                <Route path="/sales-pipeline">{() => <RoutePage Component={SalesPipelinePage} />}</Route>
                <Route path="/sales-tasks">{() => <RoutePage Component={SalesTasksPage} />}</Route>
                <Route path="/sales-sequences">{() => <RoutePage Component={SalesSequencesPage} />}</Route>
                <Route path="/demo-scheduler">{() => <RoutePage Component={DemoSchedulerPage} />}</Route>
                <Route path="/meeting-booking">{() => <RoutePage Component={MeetingBookingPage} />}</Route>
                <Route path="/lead-imports">{() => <RoutePage Component={LeadImportsPage} />}</Route>
                <Route path="/map-view">{() => <RoutePage Component={MapViewPage} />}</Route>
                <Route path="/quotations">{() => <RoutePage Component={QuotationLogsPage} />}</Route>
                <Route path="/quotation-maker">{() => <RoutePage Component={QuotationMakerPage} />}</Route>
                <Route path="/ai-control">{() => <RoutePage Component={AIControlCenterPage} />}</Route>
                <Route path="/buddy">{() => <RoutePage Component={BuddyDashboardPage} />}</Route>
                <Route path="/buddy-rules">{() => <RoutePage Component={BuddyRulesPage} />}</Route>
                <Route path="/marketing-content">{() => <RoutePage Component={MarketingContentPage} />}</Route>
                <Route path="/lead-intelligence">{() => <RoutePage Component={LeadIntelligencePage} />}</Route>
                <Route path="/outreach-templates">{() => <RoutePage Component={OutreachTemplatesPage} />}</Route>
                <Route path="/buddy-family">{() => <RoutePage Component={BuddyParivarPage} />}</Route>
                <Route path="/users">{() => <RoutePage Component={UserManagementPage} />}</Route>
                <Route path="/feedback">{() => <RoutePage Component={FeedbackPage} />}</Route>
                <Route path="/settings">{() => <RoutePage Component={SettingsPage} />}</Route>
                <Route path="/report-card">{() => <RoutePage Component={ReportCardPage} />}</Route>
                <Route path="/graphs">{() => <RoutePage Component={GraphsPage} />}</Route>
                <Route path="/service-manager">{() => <RoutePage Component={ServiceManagerPage} />}</Route>
                <Route path="/power-dashboard">{() => <RoutePage Component={PowerDashboardPage} />}</Route>
                <Route path="/admin-health">{() => <RoutePage Component={AdminHealthPage} />}</Route>
                <Route path="/testing">{() => <RoutePage Component={TestingLabPage} />}</Route>
                <Route path="/wa-beta">{() => <RoutePage Component={WaBetaTestingPage} />}</Route>
                <Route path="/product-manager">{() => <RoutePage Component={ProductManagerPage} />}</Route>
                <Route path="/ai-tools">{() => <RoutePage Component={AIToolsPage} />}</Route>
                <Route component={NotFoundPage} />
              </Switch>
            </Layout>
            </RoleGuard>
          </AuthGuard>
        )}
      </Route>
    </Switch>
  );
}

export default function App() {
  const [showGreeting, setShowGreeting] = useState(true);

  return (
    <ErrorBoundary fallbackMessage="The application encountered a critical error. Please refresh the page.">
      <GlobalErrorHandlers />
      <AuthProvider>
        <RoleProvider>
          <AdminModeProvider>
            <NotificationProvider>
              {showGreeting && (
                <AIGreeting onDismiss={() => setShowGreeting(false)} />
              )}
              <AppRoutes />
            </NotificationProvider>
          </AdminModeProvider>
        </RoleProvider>
      </AuthProvider>
      <Toaster />
      <PWAInstallPrompt />
    </ErrorBoundary>
  );
}
