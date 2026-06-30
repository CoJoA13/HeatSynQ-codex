import { users } from './data/seed';
import { OrderEntryModule } from './modules/order-entry/OrderEntryModule';

export default function App() {
  return (
    <main className="app-shell">
      <OrderEntryModule currentUser={users[0]} />
    </main>
  );
}
