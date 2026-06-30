import type { Order } from '../../../domain/types';

interface ActivityPanelsProps {
  order: Order;
}

export function ActivityPanels({ order }: ActivityPanelsProps) {
  return (
    <aside className="activity-panels" aria-label="Order activity">
      <section className="activity-panel" aria-labelledby="order-notes-title">
        <h2 id="order-notes-title">Order Notes</h2>
        {order.orderNotes.length === 0 ? (
          <p className="empty-copy">No order notes.</p>
        ) : (
          order.orderNotes.map((note) => (
            <article key={note.id} className="activity-note">
              <strong>{note.createdBy}</strong>
              <span>{note.createdOn}</span>
              <p>{note.note}</p>
            </article>
          ))
        )}
      </section>

      <section className="activity-panel" aria-labelledby="customer-notes-title">
        <h2 id="customer-notes-title">Customer Notes</h2>
        {order.customerNotes.length === 0 ? (
          <p className="empty-copy">No customer notes.</p>
        ) : (
          order.customerNotes.map((note) => (
            <article key={note.id} className="activity-note">
              <strong>{note.createdBy}</strong>
              <span>{note.createdOn}</span>
              <p>{note.note}</p>
            </article>
          ))
        )}
      </section>

      <section className="activity-panel" aria-labelledby="order-events-title">
        <h2 id="order-events-title">Order Events</h2>
        {order.events.length === 0 ? (
          <p className="empty-copy">No order events.</p>
        ) : (
          <table className="data-table activity-table">
            <tbody>
              {order.events.map((event) => (
                <tr key={event.id}>
                  <td>{event.date}</td>
                  <td>{event.code}</td>
                  <td>{event.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="activity-panel" aria-labelledby="customer-documents-title">
        <h2 id="customer-documents-title">Customer Documents</h2>
        {order.documents.length === 0 ? (
          <p className="empty-copy">No customer documents.</p>
        ) : (
          <ul className="document-list">
            {order.documents.map((document) => (
              <li key={document.id}>
                <span>{document.fileName}</span>
                <small>
                  {document.source} / {document.dateCopied}
                </small>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
}
