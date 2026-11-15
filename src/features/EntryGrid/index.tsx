import styles from "./index.module.css";

import EntryCard from "@/features/EntryCard";

import type { EntrySummary } from "@/shared/types/content";

interface EntryGridProps {
  entries: EntrySummary[];
}
const EntryGrid = ({ entries }: EntryGridProps) => (
  <div className={styles["grid"]}>
    {entries.map((entry) => (
      <EntryCard key={entry.id} entry={entry} />
    ))}
  </div>
);
export default EntryGrid;
