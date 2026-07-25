import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useClickSound } from '@/hooks/useClickSound';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import { Home } from './pages/Home';
import { About } from './pages/About';
import { Education } from './pages/Education';
import { RecoveryResources } from './pages/RecoveryResources';
import { ProfessionalTraining } from './pages/ProfessionalTraining';
import { Media } from './pages/Media';
import { Publishing } from './pages/Publishing';
import { SunriseOS } from './pages/SunriseOS';
import { TheSunriseGroup } from './pages/TheSunriseGroup';
import { Contact } from './pages/Contact';
import { ComingSoon } from './pages/ComingSoon';
import { Partnership } from './pages/Partnership';
import { DigitalLearning } from './pages/DigitalLearning';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfUse } from './pages/TermsOfUse';
import { Disclaimer } from './pages/Disclaimer';
import { AccessibilityStatement } from './pages/AccessibilityStatement';
import NotFound from './pages/not-found';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/education" component={Education} />
      <Route path="/recovery-resources" component={RecoveryResources} />
      <Route path="/professional-training" component={ProfessionalTraining} />
      <Route path="/media" component={Media} />
      <Route path="/publishing" component={Publishing} />
      <Route path="/sunriseos" component={SunriseOS} />
      <Route path="/the-sunrise-group" component={TheSunriseGroup} />
      <Route path="/contact" component={Contact} />
      <Route path="/coming-soon" component={ComingSoon} />
      <Route path="/partnership" component={Partnership} />
      <Route path="/digital-learning" component={DigitalLearning} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-use" component={TermsOfUse} />
      <Route path="/disclaimer" component={Disclaimer} />
      <Route path="/accessibility" component={AccessibilityStatement} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useClickSound();
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
