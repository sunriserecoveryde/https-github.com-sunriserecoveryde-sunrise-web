import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import { Home } from './pages/Home';
import { About } from './pages/About';
import { Education } from './pages/Education';
import { SunriseOS } from './pages/SunriseOS';
import { TheSunriseGroup } from './pages/TheSunriseGroup';
import { Contact } from './pages/Contact';
import { ComingSoon } from './pages/ComingSoon';
import NotFound from './pages/not-found';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/education" component={Education} />
      <Route path="/sunriseos" component={SunriseOS} />
      <Route path="/the-sunrise-group" component={TheSunriseGroup} />
      <Route path="/contact" component={Contact} />
      <Route path="/coming-soon" component={ComingSoon} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
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
