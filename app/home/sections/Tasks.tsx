"use client";

import { useState } from "react";
import {
  AnimatePresence,
  motion,
  Reorder,
  useDragControls,
} from "motion/react";
import {
  Check,
  ChevronDown,
  Cloud,
  CloudOff,
  Droplet,
  GripVertical,
  ListTodo,
  Pencil,
  Plus,
  X,
} from "lucide-react";
import TaskSync from "@/components/home/TaskSync";
import {
  IconButton,
  Panel,
  textButton,
  type PanelChrome,
} from "@/components/home/ui";
import { dayKey, formatNumber } from "@/lib/home/format";
import { TASK_DAILY_CAP, taskReward, useGarden } from "@/lib/home/garden";
import { setPrefs, usePrefs } from "@/lib/home/prefs";
import { useHydrated } from "@/lib/home/store";
import { useSync, useSyncStatus } from "@/lib/home/sync";
import {
  addTodo,
  clearDone,
  editTodo,
  moveTodo,
  removeTodo,
  reorderOpen,
  sortTodos,
  TODO_MAX_LENGTH,
  toggleTodo,
  useTodos,
  type Todo,
} from "@/lib/home/todos";
import { cn } from "@/lib/utils";

const ITEM_MOTION = {
  initial: { opacity: 0, y: -6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: -16, transition: { duration: 0.15 } },
  transition: { type: "spring", stiffness: 500, damping: 40 },
} as const;

// Everything in a row sits on a 20px line, so a one-line task centres on
// its checkbox and a longer one hangs from the first line.
const ROW =
  "group flex items-start gap-2 rounded-xl px-2 py-2 transition-colors hover:bg-white/4";

/** The grip's footprint. Finished tasks can't be dragged, and keep an
 *  empty slot this size so ticking one off doesn't shift it sideways. */
const GRIP_SLOT = "-ml-1 grid size-5 shrink-0 place-items-center";

const ACTION =
  "grid size-5 cursor-pointer place-items-center rounded text-muted-foreground";

/** Checkbox, text (double-click to edit) and actions: everything but the grip. */
const TodoRow = ({ todo }: { todo: Todo }) => {
  const [editing, setEditing] = useState(false);

  return (
    <>
      <button
        type="button"
        role="checkbox"
        aria-checked={todo.done}
        aria-label={todo.text}
        onClick={() => toggleTodo(todo.id)}
        className={cn(
          "focus-visible:ring-ring grid size-5 shrink-0 cursor-pointer place-items-center rounded-full border transition focus-visible:ring-2 focus-visible:outline-none",
          todo.done
            ? "border-glow bg-glow text-primary-foreground"
            : "border-foreground/30 hover:border-glow",
        )}
      >
        <Check
          className={cn(
            "size-3 transition",
            todo.done ? "scale-100" : "scale-0",
          )}
          strokeWidth={3}
        />
      </button>

      {editing ? (
        <input
          autoFocus
          defaultValue={todo.text}
          maxLength={TODO_MAX_LENGTH}
          aria-label="edit task"
          onBlur={(e) => {
            editTodo(todo.id, e.currentTarget.value);
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") setEditing(false);
          }}
          className="border-glass-edge focus:border-glow -my-0.5 ml-1 h-6 min-w-0 flex-1 rounded-md border bg-black/20 px-2 py-0 text-sm leading-5 normal-case outline-none"
        />
      ) : (
        <span
          onDoubleClick={() => setEditing(true)}
          className={cn(
            "ml-1 min-w-0 flex-1 text-sm leading-5 break-words normal-case transition-colors",
            todo.done &&
              "text-muted-foreground line-through decoration-white/30",
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
              aria-label={`edit "${todo.text}"`}
              onClick={() => setEditing(true)}
              className={cn(ACTION, "hover:text-foreground")}
            >
              <Pencil className="size-3.5" />
            </button>
          )}
          <button
            type="button"
            aria-label={`delete "${todo.text}"`}
            onClick={() => removeTodo(todo.id)}
            className={cn(ACTION, "hover:text-destructive")}
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}
    </>
  );
};

/**
 * An open task, draggable by its grip. Dragging starts only from the grip so
 * clicking the checkbox or text never picks the row up; the grip also takes
 * the arrow keys, for reordering without a pointer.
 */
const OpenTodo = ({ todo }: { todo: Todo }) => {
  const controls = useDragControls();

  return (
    <Reorder.Item
      as="li"
      value={todo.id}
      dragListener={false}
      dragControls={controls}
      {...ITEM_MOTION}
      whileDrag={{ scale: 1.02 }}
      className={cn(ROW, "relative")}
    >
      <button
        type="button"
        aria-label={`reorder "${todo.text}"`}
        aria-describedby="reorder-help"
        onPointerDown={(e) => controls.start(e)}
        onKeyDown={(e) => {
          if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
          e.preventDefault();
          moveTodo(todo.id, e.key === "ArrowUp" ? -1 : 1);
        }}
        className={cn(
          GRIP_SLOT,
          "text-muted-foreground hover:text-foreground focus-visible:ring-ring cursor-grab touch-none rounded opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:outline-none active:cursor-grabbing max-md:opacity-60",
        )}
      >
        <GripVertical className="size-4" />
      </button>
      <TodoRow todo={todo} />
    </Reorder.Item>
  );
};

const Tasks = ({
  className,
  chrome,
}: {
  className?: string;
  chrome?: PanelChrome;
}) => {
  const todos = useTodos();
  const garden = useGarden();
  const hydrated = useHydrated();
  const [draft, setDraft] = useState("");
  const [syncView, setSyncView] = useState(false);
  const { code } = useSync();
  const { state: syncState } = useSyncStatus();
  const { hideDone } = usePrefs();

  const sorted = sortTodos(todos);
  const openTodos = sorted.filter((t) => !t.done);
  const doneTodos = sorted.filter((t) => t.done);
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
        <span className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">
            {openTodos.length
              ? `${openTodos.length} to go`
              : todos.length
                ? "all done"
                : ""}
          </span>
          <IconButton
            label={
              code
                ? `sync: ${syncState === "offline" ? "offline" : "on"}`
                : "sync with your phone"
            }
            aria-pressed={syncView}
            onClick={() => setSyncView((v) => !v)}
            className={cn("size-8", syncView && "bg-white/10")}
          >
            {code && syncState === "offline" ? (
              <CloudOff className="text-destructive size-3.5" />
            ) : (
              <Cloud className={cn("size-3.5", code && "text-glow")} />
            )}
          </IconButton>
        </span>
      }
    >
      {hydrated && syncView ? (
        <TaskSync onBack={() => setSyncView(false)} />
      ) : (
        <>
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
              aria-label="new task"
              className="border-glass-edge placeholder:text-muted-foreground/70 focus:border-glow/70 focus:ring-glow/20 h-10 min-w-0 flex-1 rounded-full border bg-black/20 px-4 text-sm normal-case transition outline-none focus:ring-4"
            />
            <IconButton type="submit" label="add task" disabled={!draft.trim()}>
              <Plus className="size-4" />
            </IconButton>
          </form>

          <p id="reorder-help" className="sr-only">
            drag, or press the up and down arrow keys, to reorder
          </p>

          {/* layoutScroll lets the drag measure rows correctly inside a scroller. */}
          <motion.div
            layoutScroll
            className="-mx-2 min-h-0 flex-1 overflow-y-auto pr-1"
          >
            <Reorder.Group
              axis="y"
              as="ul"
              values={openTodos.map((t) => t.id)}
              onReorder={reorderOpen}
            >
              <AnimatePresence initial={false}>
                {openTodos.map((t) => (
                  <OpenTodo key={t.id} todo={t} />
                ))}
              </AnimatePresence>
            </Reorder.Group>
            {doneTodos.length > 0 && (
              <button
                type="button"
                aria-expanded={!hideDone}
                aria-controls="tasks-done"
                onClick={() => setPrefs({ hideDone: !hideDone })}
                className="text-muted-foreground hover:text-foreground focus-visible:ring-ring mt-1 flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition focus-visible:ring-2 focus-visible:outline-none"
              >
                <ChevronDown
                  className={cn(
                    "size-3.5 transition-transform",
                    hideDone && "-rotate-90",
                  )}
                />
                completed {doneTodos.length}
              </button>
            )}
            <AnimatePresence initial={false}>
              {!hideDone && (
                <motion.ul
                  key="done"
                  id="tasks-done"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <AnimatePresence initial={false}>
                    {doneTodos.map((t) => (
                      <motion.li
                        key={t.id}
                        layout
                        {...ITEM_MOTION}
                        className={ROW}
                      >
                        <span aria-hidden="true" className={GRIP_SLOT} />
                        <TodoRow todo={t} />
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </motion.ul>
              )}
            </AnimatePresence>
            {hydrated && todos.length === 0 && (
              <p className="text-muted-foreground px-2 py-8 text-center text-sm">
                no tasks yet
              </p>
            )}
          </motion.div>

          <footer className="border-glass-edge mt-3 flex items-center justify-between gap-2 border-t pt-3 text-xs">
            <span
              className="text-muted-foreground flex items-center gap-1"
              title={`up to ${TASK_DAILY_CAP} tasks a day earn rewards`}
            >
              each task:
              <span className="text-glow-2 font-pixel inline-flex items-center gap-0.5">
                <Droplet className="size-3" />
                {formatNumber(reward.drops)}
              </span>
              <span className="text-glow font-pixel">+{reward.xp} xp</span>
              <span className="text-muted-foreground/70">
                | {Math.min(rewardedToday, TASK_DAILY_CAP)}/{TASK_DAILY_CAP}{" "}
                today
              </span>
            </span>
            {doneTodos.length > 0 && (
              <button
                type="button"
                onClick={clearDone}
                className={cn(textButton, "text-muted-foreground shrink-0")}
              >
                clear done
              </button>
            )}
          </footer>
        </>
      )}
    </Panel>
  );
};

export default Tasks;
