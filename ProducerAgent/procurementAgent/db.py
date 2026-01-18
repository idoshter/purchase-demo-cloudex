import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

DB_PATH = Path(os.getenv("PROCUREMENT_DB_PATH", "procurement.db")).resolve()

SCHEMA_SQL = """
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  email TEXT,
  phone TEXT
);

CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'unit',
  reorder_point INTEGER NOT NULL DEFAULT 10,
  min_level INTEGER NOT NULL DEFAULT 5,
  lead_time_days INTEGER NOT NULL DEFAULT 3,
  preferred_supplier_id INTEGER,
  FOREIGN KEY (preferred_supplier_id) REFERENCES suppliers(id)
);

CREATE TABLE IF NOT EXISTS inventory (
  item_id INTEGER PRIMARY KEY,
  on_hand INTEGER NOT NULL DEFAULT 0,
  reserved INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_id INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('DRAFT','PLACED','RECEIVED','CANCELLED')) DEFAULT 'DRAFT',
  created_at TEXT NOT NULL,
  expected_at TEXT,
  notes TEXT,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

CREATE TABLE IF NOT EXISTS purchase_order_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  po_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  qty INTEGER NOT NULL CHECK(qty > 0),
  unit_price REAL,
  FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id)
);

CREATE TABLE IF NOT EXISTS stock_moves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL,
  qty INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('RECEIVE','ISSUE','ADJUST')),
  ref TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (item_id) REFERENCES items(id)
);
"""

SEED_SQL = """
INSERT OR IGNORE INTO suppliers (id, name, email, phone) VALUES
  (1, 'Acme Supplies', 'orders@acme.example', '+1-555-0100'),
  (2, 'Mediterranean Wholesale', 'sales@medwh.example', '+972-55-555-5555');

INSERT OR IGNORE INTO items (id, sku, name, unit, reorder_point, min_level, lead_time_days, preferred_supplier_id) VALUES
  (1, 'COF-001', 'Coffee Beans 1kg', 'bag', 12, 6, 4, 1),
  (2, 'TUN-001', 'Tuna Can', 'can', 24, 12, 3, 2),
  (3, 'RCE-005', 'Rice 5kg', 'bag', 8, 4, 5, 2),
  (4, 'SUG-001', 'Sugar 1kg', 'bag', 10, 5, 3, 1),
  (5, 'MIL-001', 'Milk 1L', 'bottle', 20, 10, 2, 2);

INSERT OR IGNORE INTO inventory (item_id, on_hand, reserved, updated_at) VALUES
  (1, 7, 0, CURRENT_TIMESTAMP),
  (2, 9, 0, CURRENT_TIMESTAMP),
  (3, 12, 0, CURRENT_TIMESTAMP),
  (4, 3, 0, CURRENT_TIMESTAMP),
  (5, 18, 0, CURRENT_TIMESTAMP);

-- seed one example PO (DRAFT)
INSERT OR IGNORE INTO purchase_orders (id, supplier_id, status, created_at, expected_at, notes)
VALUES (1, 2, 'DRAFT', CURRENT_TIMESTAMP, NULL, 'Seed draft order');

INSERT OR IGNORE INTO purchase_order_lines (id, po_id, item_id, qty, unit_price)
VALUES (1, 1, 2, 12, 4.20);
"""

@contextmanager
def get_conn():
  DB_PATH.parent.mkdir(parents=True, exist_ok=True)
  conn = sqlite3.connect(str(DB_PATH))
  conn.row_factory = sqlite3.Row
  try:
    yield conn
    conn.commit()
  finally:
    conn.close()

def init_db_if_needed() -> None:
  with get_conn() as conn:
    conn.executescript(SCHEMA_SQL)
    conn.executescript(SEED_SQL)

def _now_iso() -> str:
  return datetime.utcnow().isoformat(timespec="seconds") + "Z"

# -------------------- Items / Inventory --------------------

def list_items() -> List[Dict[str, Any]]:
  with get_conn() as conn:
    rows = conn.execute("""
      SELECT i.id, i.sku, i.name, i.unit, i.reorder_point, i.min_level, i.lead_time_days,
             s.name AS supplier,
             inv.on_hand, inv.reserved, inv.updated_at
      FROM items i
      LEFT JOIN suppliers s ON s.id = i.preferred_supplier_id
      LEFT JOIN inventory inv ON inv.item_id = i.id
      ORDER BY i.id
    """).fetchall()
    return [dict(r) for r in rows]

def get_item_by_name_or_sku(name_or_sku: str) -> Optional[Dict[str, Any]]:
  with get_conn() as conn:
    r = conn.execute("""
      SELECT i.id, i.sku, i.name, i.unit, i.reorder_point, i.min_level, i.lead_time_days,
             i.preferred_supplier_id, s.name AS supplier,
             inv.on_hand, inv.reserved, inv.updated_at
      FROM items i
      LEFT JOIN suppliers s ON s.id = i.preferred_supplier_id
      LEFT JOIN inventory inv ON inv.item_id = i.id
      WHERE lower(i.sku)=lower(?) OR lower(i.name)=lower(?)
      LIMIT 1
    """, (name_or_sku, name_or_sku)).fetchone()
    return dict(r) if r else None

def list_low_stock() -> List[Dict[str, Any]]:
  with get_conn() as conn:
    rows = conn.execute("""
      SELECT i.id, i.sku, i.name, i.unit, i.reorder_point, i.min_level, i.lead_time_days,
             s.name AS supplier,
             inv.on_hand, inv.reserved
      FROM items i
      JOIN inventory inv ON inv.item_id = i.id
      LEFT JOIN suppliers s ON s.id = i.preferred_supplier_id
      WHERE inv.on_hand <= i.reorder_point
      ORDER BY (i.reorder_point - inv.on_hand) DESC
    """).fetchall()
    return [dict(r) for r in rows]

def recommend_order_quantities() -> List[Dict[str, Any]]:
  """
  MVP policy:
    target = reorder_point + min_level
    order_qty = max(0, target - on_hand)
  """
  low = list_low_stock()
  recs: List[Dict[str, Any]] = []
  for x in low:
    target = int(x["reorder_point"]) + int(x["min_level"])
    on_hand = int(x["on_hand"] or 0)
    qty = max(0, target - on_hand)
    if qty > 0:
      recs.append({
        "sku": x["sku"],
        "name": x["name"],
        "unit": x["unit"],
        "on_hand": on_hand,
        "reorder_point": int(x["reorder_point"]),
        "min_level": int(x["min_level"]),
        "recommended_qty": qty,
        "supplier": x["supplier"],
        "lead_time_days": int(x["lead_time_days"]),
      })
  return recs

# -------------------- Purchase Orders --------------------

def list_purchase_orders(status: Optional[str] = None) -> List[Dict[str, Any]]:
  """
  List PO headers. Optionally filter by status:
  DRAFT, PLACED, RECEIVED, CANCELLED or None for all.
  """
  with get_conn() as conn:
    if status:
      rows = conn.execute("""
        SELECT po.id,
               s.name AS supplier,
               po.status,
               po.created_at,
               po.expected_at,
               (SELECT COUNT(*) FROM purchase_order_lines pol WHERE pol.po_id = po.id) AS line_count
        FROM purchase_orders po
        JOIN suppliers s ON s.id = po.supplier_id
        WHERE po.status = ?
        ORDER BY po.id DESC
      """, (status,)).fetchall()
    else:
      rows = conn.execute("""
        SELECT po.id,
               s.name AS supplier,
               po.status,
               po.created_at,
               po.expected_at,
               (SELECT COUNT(*) FROM purchase_order_lines pol WHERE pol.po_id = po.id) AS line_count
        FROM purchase_orders po
        JOIN suppliers s ON s.id = po.supplier_id
        ORDER BY po.id DESC
      """).fetchall()

    return [dict(r) for r in rows]

def list_open_purchase_orders() -> List[Dict[str, Any]]:
  """Open = not received/cancelled."""
  with get_conn() as conn:
    rows = conn.execute("""
      SELECT po.id,
             s.name AS supplier,
             po.status,
             po.created_at,
             po.expected_at,
             (SELECT COUNT(*) FROM purchase_order_lines pol WHERE pol.po_id = po.id) AS line_count
      FROM purchase_orders po
      JOIN suppliers s ON s.id = po.supplier_id
      WHERE po.status IN ('DRAFT','PLACED')
      ORDER BY po.id DESC
    """).fetchall()
    return [dict(r) for r in rows]

def list_received_purchase_orders() -> List[Dict[str, Any]]:
  with get_conn() as conn:
    rows = conn.execute("""
      SELECT po.id,
             s.name AS supplier,
             po.status,
             po.created_at,
             po.expected_at,
             (SELECT COUNT(*) FROM purchase_order_lines pol WHERE pol.po_id = po.id) AS line_count
      FROM purchase_orders po
      JOIN suppliers s ON s.id = po.supplier_id
      WHERE po.status = 'RECEIVED'
      ORDER BY po.id DESC
    """).fetchall()
    return [dict(r) for r in rows]

def create_purchase_order(supplier_name: str, lines: List[Dict[str, Any]], notes: str = "") -> Dict[str, Any]:
  """
  lines: [{"sku_or_name": "...", "qty": 10, "unit_price": 4.2?}, ...]
  """
  with get_conn() as conn:
    supplier = conn.execute(
      "SELECT id, name FROM suppliers WHERE lower(name)=lower(?)",
      (supplier_name,),
    ).fetchone()
    if not supplier:
      return {"status": "error", "error_message": f"Supplier '{supplier_name}' not found."}

    created_at = _now_iso()
    expected_at = (datetime.utcnow() + timedelta(days=3)).date().isoformat()

    cur = conn.execute(
      "INSERT INTO purchase_orders (supplier_id, status, created_at, expected_at, notes) VALUES (?, 'PLACED', ?, ?, ?)",
      (supplier["id"], created_at, expected_at, notes),
    )
    po_id = cur.lastrowid

    # IMPORTANT: lookup items using THE SAME connection (avoid nested connection calls)
    for ln in lines:
      sku_or_name = ln["sku_or_name"]
      item = conn.execute("""
        SELECT i.id, i.sku, i.name
        FROM items i
        WHERE lower(i.sku)=lower(?) OR lower(i.name)=lower(?)
        LIMIT 1
      """, (sku_or_name, sku_or_name)).fetchone()

      if not item:
        return {"status": "error", "error_message": f"Item '{sku_or_name}' not found."}

      qty = int(ln["qty"])
      unit_price = ln.get("unit_price")
      conn.execute(
        "INSERT INTO purchase_order_lines (po_id, item_id, qty, unit_price) VALUES (?, ?, ?, ?)",
        (po_id, int(item["id"]), qty, unit_price),
      )

    return {"status": "success", "po_id": po_id, "expected_at": expected_at}

def get_purchase_order(po_id: int) -> Dict[str, Any]:
  with get_conn() as conn:
    po = conn.execute("""
      SELECT po.id, po.status, po.created_at, po.expected_at, po.notes, s.name AS supplier
      FROM purchase_orders po
      JOIN suppliers s ON s.id = po.supplier_id
      WHERE po.id = ?
    """, (po_id,)).fetchone()
    if not po:
      return {"status": "error", "error_message": f"PO {po_id} not found."}

    lines = conn.execute("""
      SELECT i.sku, i.name, pol.qty, pol.unit_price
      FROM purchase_order_lines pol
      JOIN items i ON i.id = pol.item_id
      WHERE pol.po_id = ?
      ORDER BY pol.id
    """, (po_id,)).fetchall()

    return {"status": "success", "po": dict(po), "lines": [dict(r) for r in lines]}

def receive_purchase_order(po_id: int) -> Dict[str, Any]:
  """
  Mark PO as RECEIVED and add qty to inventory with stock_moves.
  """
  with get_conn() as conn:
    po = conn.execute("SELECT id, status FROM purchase_orders WHERE id = ?", (po_id,)).fetchone()
    if not po:
      return {"status": "error", "error_message": f"PO {po_id} not found."}
    if po["status"] == "RECEIVED":
      return {"status": "success", "message": f"PO {po_id} already received."}

    lines = conn.execute("SELECT item_id, qty FROM purchase_order_lines WHERE po_id = ?", (po_id,)).fetchall()
    now = _now_iso()

    for ln in lines:
      item_id = int(ln["item_id"])
      qty = int(ln["qty"])
      conn.execute("""
        INSERT INTO inventory (item_id, on_hand, reserved, updated_at)
        VALUES (?, ?, 0, ?)
        ON CONFLICT(item_id) DO UPDATE SET
          on_hand = on_hand + excluded.on_hand,
          updated_at = excluded.updated_at
      """, (item_id, qty, now))
      conn.execute(
        "INSERT INTO stock_moves (item_id, qty, type, ref, created_at) VALUES (?, ?, 'RECEIVE', ?, ?)",
        (item_id, qty, f"PO:{po_id}", now),
      )

    conn.execute("UPDATE purchase_orders SET status='RECEIVED' WHERE id = ?", (po_id,))
    return {"status": "success", "message": f"PO {po_id} received and inventory updated."}
