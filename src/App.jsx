import { useEffect, useState } from "react";
import {
  seedIfEmpty,
  getAllDishes,
  addDish,
  updateDish,
  deleteDish,
} from "./db.js";
import Home from "./screens/Home.jsx";
import Menu from "./screens/Menu.jsx";
import DishDetail from "./screens/DishDetail.jsx";
import Draw from "./screens/Draw.jsx";
import AddDish from "./screens/AddDish.jsx";

// View state instead of a router (single device, few screens, minimal deps).
// Screens so far: home, browse menu, the shared dish detail, and a placeholder
// for the gacha draw (built in step 4). Gacha/timers/etc. arrive later.
export default function App() {
  const [dishes, setDishes] = useState(null); // null = still loading
  const [view, setView] = useState("home"); // home | menu | detail | draw | add
  const [selectedId, setSelectedId] = useState(null);
  const [returnView, setReturnView] = useState("menu"); // where detail's back goes
  const [editingId, setEditingId] = useState(null); // dish being edited, if any

  // Open the shared dish detail, remembering which screen we came from so its
  // back button returns there (menu or the gacha draw).
  function openDish(id, from) {
    setSelectedId(id);
    setReturnView(from);
    setView("detail");
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      await seedIfEmpty();
      const all = await getAllDishes();
      if (alive) setDishes(all);
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (dishes === null) {
    return <p className="loading">Loading…</p>;
  }

  if (view === "menu") {
    return (
      <Menu
        dishes={dishes}
        onHome={() => setView("home")}
        onOpenDish={(id) => openDish(id, "menu")}
        onAdd={() => setView("add")}
      />
    );
  }

  if (view === "detail") {
    const selected = dishes.find((d) => d.id === selectedId);
    if (selected) {
      return (
        <DishDetail
          dish={selected}
          backLabel={returnView === "draw" ? "draw" : "menu"}
          onBack={() => setView(returnView)}
          onEdit={() => {
            setEditingId(selected.id);
            setView("add");
          }}
          onDelete={async (id) => {
            await deleteDish(id);
            setDishes(await getAllDishes());
            setView("menu");
          }}
        />
      );
    }
    // Selected dish missing (shouldn't happen) — fall back to the menu.
    setView("menu");
    return null;
  }

  if (view === "draw") {
    return (
      <Draw
        dishes={dishes}
        onBack={() => setView("home")}
        onOpenDish={(id) => openDish(id, "draw")}
      />
    );
  }

  if (view === "add") {
    const editingDish = editingId
      ? dishes.find((d) => d.id === editingId)
      : null;
    return (
      <AddDish
        dishes={dishes}
        dish={editingDish}
        onCancel={() => {
          const wasEditing = !!editingId;
          setEditingId(null);
          setView(wasEditing ? "detail" : "menu");
        }}
        onSaved={async (data) => {
          const wasEditing = !!editingId;
          if (wasEditing) await updateDish({ ...data, id: editingId });
          else await addDish(data);
          setDishes(await getAllDishes()); // refresh the in-memory list
          setEditingId(null);
          setView(wasEditing ? "detail" : "menu");
        }}
      />
    );
  }

  return (
    <Home
      onNoIdea={() => setView("draw")}
      onInspo={() => setView("menu")}
    />
  );
}
