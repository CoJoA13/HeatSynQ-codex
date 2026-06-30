import { users } from './data/seed';
import { AppShell } from './components/AppShell';

export default function App() {
  return <AppShell currentUser={users[0]} />;
}
