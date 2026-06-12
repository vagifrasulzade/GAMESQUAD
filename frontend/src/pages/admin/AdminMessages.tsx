import { useEffect, useState } from "react";
import { api, fetchAll } from "../../lib/api";
import type { User } from "../../lib/types";
import { AdminHeader, Pagination, Panel, Table, Row, Cell, Pill, Avatar2, RowActions, usePagination } from "./adminUi";

interface Message {
  id: number;
  conversation: number;
  sender: User;
  body: string;
  read: boolean;
  created_at: string;
}

export default function AdminMessages() {
  const [items, setItems] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetchAll<Message>("/messages/")
      .then(setItems)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const { page, setPage, pageCount, pageItems, total } = usePagination(items);

  async function remove(m: Message) {
    if (!confirm("Delete this message? This cannot be undone.")) return;
    await api.delete(`/messages/${m.id}/`);
    setItems((prev) => prev.filter((x) => x.id !== m.id));
  }

  return (
    <div className="animate-fade-in">
      <AdminHeader title="Messages" subtitle={`${items.length} messages across all conversations`} />
      <Panel>
        <Table
          columns={["Sender", "Message", "Conversation", "Read", "Sent", ""]}
          loading={loading}
          empty={items.length === 0}
        >
          {pageItems.map((m) => (
            <Row key={m.id}>
              <Cell>
                <div className="flex items-center gap-2.5">
                  <Avatar2 name={m.sender.username} />
                  <span className="font-medium text-white">{m.sender.username}</span>
                </div>
              </Cell>
              <Cell className="max-w-md truncate text-slate-300">{m.body}</Cell>
              <Cell>#{m.conversation}</Cell>
              <Cell>
                <Pill tone={m.read ? "green" : "amber"}>{m.read ? "Read" : "Unread"}</Pill>
              </Cell>
              <Cell>{new Date(m.created_at).toLocaleString()}</Cell>
              <Cell>
                <RowActions onDelete={() => remove(m)} />
              </Cell>
            </Row>
          ))}
        </Table>
        <Pagination page={page} pageCount={pageCount} total={total} onPage={setPage} />
      </Panel>
    </div>
  );
}
