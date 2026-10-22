"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Droplet, ListTodo, Pencil, Plus, X } from "lucide-react";
import { IconButton, Panel, type PanelChrome } from "@/components/home/ui";
import { dayKey, formatNumber } from "@/lib/home/format";
import { TASK_DAILY_CAP, taskReward, useGarden } from "@/lib/home/garden";
import { useHydrated } from "@/lib/home/store";
import {
  addTodo,
  clearDone,
  editTodo,
  removeTodo,
  sortTodos,
  TODO_MAX_LENGTH,
  toggleTodo,
  useTodos,
  type Todo,
} from "@/lib/home/todos";
import { cn } from "@/lib/utils";

const TodoItem = ({ todo }: { todo: Todo }) => {
  const [editing, setEditing] = useState(false);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 500, damping: 40 }}
      className="group flex items-start gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/4"
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={todo.done}
        aria-label={todo.text}
        onClick={() => toggleTodo(todo.id)}
        className={cn(
          "focus-visible:ring-ring mt-0.5 grid size-5 shrink-0 cursor-pointer place-items-center rounded-full border transition focus-visible:ring-2 focus-visible:outline-none",
          todo.done
            ? "border-glow bg-glow text-primary-foreground"
            : "border-foreground/30 hover:border-glow",
        )}
      >
        <Check className={cn("size-3 transition", todo.done ? "scale-100" : "scale-0")} strokeWidth={3} />
      </button>

      {editing ? (
        <input
          autoFocus
          defaultValue={todo.text}
          maxLength={TODO_MAX_LENGTH}
          aria-label="Edit task"
          onBlur={(e) => {
            editTodo(todo.id, e.currentTarget.value);
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") setEditing(false);
          }}
          className="border-glass-edge focus:border-glow min-w-0 flex-1 rounded-md border bg-black/20 px-2 py-0.5 text-sm normal-case outline-none"
        />
      ) : (
        <span
          onDoubleClick={() => setEditing(true)}
          className={cn(
            "min-w-0 flex-1 text-sm leading-snug break-words normal-case transition-colors",
            todo.done && "text-muted-foreground line-through decoration-white/30",
          )}
        >
          {todo.text}
        </span>
      )}

      {!editing && (
        <div className="flex shrink-0 gap-0.5 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100 max-md:opacity-100">
          {!todo.done && (
            <button
              type="button"
              aria-label={`Edit "${todo.text}"`}
              onClick={() => setEditing(true)}
              className="text-muted-foreground hover:text-foreground cursor-pointer rounded p-0.5"
            >
              <Pencil className="size-3.5" />
            </button>
          )}
          <button
            type="button"
            aria-label={`Delete "${todo.text}"`}
            onClick={() => removeTodo(todo.id)}
            className="text-muted-foreground hover:text-destructive cursor-pointer rounded p-0.5"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}
    </motion.li>
  );
};

const Tasks = ({ className, chrome }: { className?: string; chrome?: PanelChrome }) => {
  const todos = useTodos();
  const garden = useGarden();
  const hydrated = useHydrated();
  const [draft, setDraft] = useState("");

  const sorted = sortTodos(todos);
  const open = todos.filter((t) => !t.done).length;
  const doneCount = todos.length - open;
  const reward = taskReward(garden);
  const rewardedToday = garden.daily.day === dayKey() ? garden.daily.tasks : 0;

  return (
    <Panel
      id="tasks"
      title="tasks"
      icon={ListTodo}
      className={className}
      chrome={chrome}
      actions={
        <span className="text-muted-foreground text-xs">
          {open ? `${open} to go` : todos.length ? "All done" : ""}
        </span>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (addTodo(draft)) setDraft("");
        }}
        className="mb-3 flex gap-2"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={TODO_MAX_LENGTH}
          placeholder="add a task…"
          aria-label="New task"
          className="border-glass-edge placeholder:text-muted-foreground/70 focus:border-glow/70 focus:ring-glow/20 h-10 min-w-0 flex-1 rounded-full border bg-black/20 px-4 text-sm normal-case transition outline-none focus:ring-4"
        />
        <IconButton type="submit" label="Add task" disabled={!draft.trim()}>
          <Plus className="size-4" />
        </IconButton>
      </form>

      <ul className="-mx-2 min-h-0 flex-1 overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {sorted.map((t) => (
            <TodoItem key={t.id} todo={t} />
          ))}
        </AnimatePresence>
        {hydrated && todos.length === 0 && (
          <li className="text-muted-foreground px-2 py-8 text-center text-sm">
            no tasks yet
          </li>
        )}
      </ul>

      <footer className="border-glass-edge mt-3 flex items-center justify-between gap-2 border-t pt-3 text-xs">
        <span className="text-muted-foreground flex items-center gap-1" title={`Up to ${TASK_DAILY_CAP} tasks a day earn rewards`}>
          Each task:
          <span className="text-glow-2 font-pixel inline-flex items-center gap-0.5">
            <Droplet className="size-3" />
            {formatNumber(reward.drops)}
          </span>
          <span className="text-glow font-pixel">+{reward.xp} xp</span>
          <span className="text-muted-foreground/70">
            · {Math.min(rewardedToday, TASK_DAILY_CAP)}/{TASK_DAILY_CAP} today
          </span>
        </span>
        {doneCount > 0 && (
          <button
            type="button"
            onClick={clearDone}
            className="text-muted-foreground hover:text-foreground shrink-0 cursor-pointer underline-offset-2 hover:underline"
          >
            Clear done
          </button>
        )}
      </footer>
    </Panel>
  );
};

export default Tasks;
