import styles from "./ScrollDownIndicator.module.css";

const ScrollDownIndicator = () => {
  return (
    <div className="relative">
      <a
        className={`absolute top-0 left-1/2 w-6 h-6 -ml-3 border-l-2 border-b-2 border-zinc-700 dark:border-zinc-50 ${styles.scrollDownIndicator}`}
      ></a>
    </div>
  );
};

export default ScrollDownIndicator;
